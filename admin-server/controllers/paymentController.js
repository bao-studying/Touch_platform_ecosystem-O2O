const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const PaymentTransaction = require("../models/PaymentTransaction");
const { CODE_PREFIX, getBankConfig, canUseBankTransfer, isBankConfigured } = require("../utils/payment");
const { shortCode, fmtVnd } = require("../utils/orderFormat");
const { notifyTenant, notifySuperAdmins } = require("../utils/notify");
const { emitToTenant } = require("../sockets");

const ORDER_CODE = new RegExp(`${CODE_PREFIX}[A-Z0-9]{8}`);

// Tìm đơn từ giao dịch: ưu tiên trường `code` do SePay tách; không có thì tự dò trong nội dung chuyển khoản
// (ngân hàng hay chèn dấu chấm/khoảng trắng và đổi hoa/thường nên chuẩn hóa trước khi dò).
async function findOrderForTransaction(payload) {
  const normalize = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const candidates = new Set();
  for (const text of [normalize(payload.code), normalize(payload.content), normalize(payload.description)]) {
    const m = text.match(new RegExp(ORDER_CODE.source, "g"));
    if (m) m.forEach((c) => candidates.add(c));
  }
  if (candidates.size === 0) return null;
  return Order.findOne({ paymentCode: { $in: [...candidates] } });
}

// Chốt trạng thái thanh toán của đơn TỪ SỔ GIAO DỊCH (luôn tính lại, idempotent):
//  • tiền đã nhận = tổng các giao dịch `credited` của đơn (mỗi giao dịch là 1 document riêng nên không thể "đè" nhau);
//  • `$max` để số đã nhận trên đơn chỉ tăng; chuyển sang paid bằng cập nhật CÓ ĐIỀU KIỆN nên chỉ 1 lần gọi "thắng"
//    (won = true) → đúng 1 thông báo "thanh toán thành công".
// Có thể gọi lại nhiều lần an toàn — dùng cả để tự sửa khi 2 request chạy song song hoặc 1 request bị dừng giữa chừng.
async function settlePayment(order) {
  const credited = await PaymentTransaction.find({ order: order._id, credited: true });
  const totalPaid = credited.reduce((sum, t) => sum + t.amount, 0);
  await Order.updateOne({ _id: order._id }, { $max: { paidVnd: totalPaid } });

  if (totalPaid >= order.totalVnd) {
    const won = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: ["unpaid", "partial"] } },
      { $set: { paymentStatus: "paid", paidAt: new Date(), paymentSource: "sepay" } },
      { new: true }
    );
    return { status: "paid", won: Boolean(won), totalPaid };
  }
  await Order.updateOne({ _id: order._id, paymentStatus: "unpaid" }, { $set: { paymentStatus: "partial" } });
  return { status: "partial", won: false, totalPaid };
}

// Xử lý 1 giao dịch tiền VÀO (định dạng webhook SePay). Dùng chung cho:
//  • giao dịch thật do Client Server chuyển tiếp sang (endpoint /internal/sepay)
//  • nút giả lập khi chưa cấu hình tài khoản (chỉ dev)
// Trả về { status, body } — luôn "success:true" khi đã xử lý xong (kể cả không khớp đơn) để SePay không gọi lại vô ích.
async function processTransfer(p) {
  const sepayId = p.id === undefined || p.id === null ? "" : String(p.id);
  const amount = Number(p.transferAmount);
  if (!sepayId || !Number.isFinite(amount) || amount <= 0) {
    return { status: 400, body: { success: false, message: "Dữ liệu giao dịch không hợp lệ" } };
  }
  // Chỉ quan tâm tiền VÀO.
  if (p.transferType && p.transferType !== "in") return { status: 200, body: { success: true, ignored: "not_incoming" } };

  // Ghi nhận giao dịch trước — unique sepayId chặn xử lý trùng khi SePay gọi lại.
  let tx;
  try {
    tx = await PaymentTransaction.create({
      sepayId,
      amount,
      gateway: String(p.gateway || ""),
      accountNumber: String(p.accountNumber || ""),
      code: String(p.code || ""),
      content: String(p.content || ""),
      referenceCode: String(p.referenceCode || ""),
      transactionDate: String(p.transactionDate || ""),
      raw: p,
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
    // SePay gọi lại cùng giao dịch. Nếu lần trước đã xử lý xong → bỏ qua. Nếu lần trước bị dừng giữa chừng (server sập,
    // mất kết nối DB...) thì result vẫn "pending" → xử lý nốt, nếu không đơn sẽ kẹt "chưa thanh toán" dù tiền đã về.
    tx = await PaymentTransaction.findOne({ sepayId });
    if (!tx || tx.result !== "pending") return { status: 200, body: { success: true, duplicate: true } };
  }

  const order = await findOrderForTransaction(p);
  if (!order) {
    tx.result = "unmatched";
    await tx.save();
    notifySuperAdmins({
      type: "payment",
      title: `Nhận ${fmtVnd(amount)} nhưng không khớp đơn nào`,
      body: `Nội dung: ${String(p.content || "(trống)").slice(0, 120)} — cần đối soát thủ công.`,
    });
    return { status: 200, body: { success: true, matched: false } };
  }

  tx.order = order._id;
  const label = shortCode(order._id);
  const tenantId = String(order.tenant);

  // Đơn đã thanh toán đủ (hoặc Super Admin đã xác nhận tay) mà vẫn có tiền về → không cộng thêm, báo để hoàn/đối soát.
  if (order.paymentStatus === "paid" || order.paymentStatus === "manual_confirmed") {
    tx.result = "already_paid";
    await tx.save();
    notifySuperAdmins({
      type: "payment",
      title: `Đơn ${label} nhận thêm ${fmtVnd(amount)}`,
      body: "Đơn đã được thanh toán trước đó — cần kiểm tra và hoàn tiền nếu chuyển trùng.",
      link: "/super-admin/orders",
    });
    return { status: 200, body: { success: true, matched: true, result: "already_paid" } };
  }

  if (order.status === "cancelled") {
    tx.result = "cancelled_order";
    await tx.save();
    notifySuperAdmins({
      type: "payment",
      title: `Đơn đã hủy ${label} nhận ${fmtVnd(amount)}`,
      body: "Khách chuyển tiền cho đơn đã hủy — cần hoàn tiền.",
      link: "/super-admin/orders",
    });
    return { status: 200, body: { success: true, matched: true, result: "cancelled_order" } };
  }

  // Đánh dấu giao dịch này đã tính vào đơn (idempotent), rồi chốt trạng thái từ sổ giao dịch.
  await PaymentTransaction.updateOne({ _id: tx._id }, { $set: { order: order._id, credited: true } });
  let settled = await settlePayment(order);
  if (settled.status === "partial") {
    // Kiểm tra lại: nếu trong lúc ghi có giao dịch khác vừa đủ tiền (chạy song song) thì chốt lại thành paid.
    const recheck = await settlePayment(order);
    if (recheck.status === "paid") settled = recheck;
  }

  if (settled.status === "paid") {
    tx.result = "paid";
    await tx.save();
    if (settled.won) {
      const extra = settled.totalPaid - order.totalVnd;
      emitToTenant(tenantId, "order:status", { orderId: order._id, paymentStatus: "paid" });
      notifyTenant(tenantId, {
        type: "payment",
        title: `Thanh toán thành công đơn ${label}`,
        body: `Đã nhận ${fmtVnd(settled.totalPaid)}. Chúng tôi sẽ sớm bắt đầu xử lý đơn của bạn.`,
        link: "/account?tab=orders",
      });
      notifySuperAdmins({
        type: "payment",
        title: `Đã nhận ${fmtVnd(amount)} cho đơn ${label}`,
        body: extra > 0 ? `Khách chuyển dư ${fmtVnd(extra)} — cần hoàn lại.` : "Thanh toán đủ, có thể chuyển sang sản xuất.",
        link: "/super-admin/orders",
      });
    }
    return { status: 200, body: { success: true, matched: true, result: "paid" } };
  }

  // Chuyển thiếu: giữ đơn ở trạng thái partial, báo cả hai phía.
  tx.result = "partial";
  await tx.save();
  const missing = order.totalVnd - settled.totalPaid;
  emitToTenant(tenantId, "order:status", { orderId: order._id, paymentStatus: "partial" });
  notifyTenant(tenantId, {
    type: "payment",
    title: `Đơn ${label} còn thiếu ${fmtVnd(missing)}`,
    body: `Chúng tôi đã nhận ${fmtVnd(settled.totalPaid)}/${fmtVnd(order.totalVnd)}. Vui lòng chuyển nốt phần còn lại.`,
    link: "/account?tab=orders",
  });
  notifySuperAdmins({
    type: "payment",
    title: `Đơn ${label} chuyển thiếu ${fmtVnd(missing)}`,
    body: `Đã nhận ${fmtVnd(settled.totalPaid)}/${fmtVnd(order.totalVnd)}.`,
    link: "/super-admin/orders",
  });
  return { status: 200, body: { success: true, matched: true, result: "partial" } };
}

// @desc  Nhận giao dịch SePay do CLIENT SERVER chuyển tiếp (SePay chỉ gọi webhook của Client Server)
// @route POST /api/payments/internal/sepay
// Xác thực server-to-server bằng JWT ký bằng JWT_SECRET dùng chung + claim purpose="sepay-forward".
// Token đăng nhập của khách cũng ký bằng secret này nhưng KHÔNG có claim đó → không gọi được endpoint này.
const internalSepay = async (req, res) => {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "sepay-forward") throw new Error("wrong purpose");
  } catch (err) {
    return res.status(401).json({ success: false, message: "Không có quyền gọi endpoint nội bộ" });
  }
  const out = await processTransfer(req.body || {});
  res.status(out.status).json(out.body);
};

// @desc  Các hình thức thanh toán đang bật — để giỏ hàng biết có cho chọn chuyển khoản không (KHÔNG lộ số tài khoản)
// @route GET /api/public/payment-options
const getPaymentOptions = async (req, res) => {
  const cfg = await getBankConfig();
  res.json({ cod: true, bankTransfer: canUseBankTransfer(cfg), bankConfigured: isBankConfigured(cfg) });
};

module.exports = { internalSepay, getPaymentOptions, processTransfer };
