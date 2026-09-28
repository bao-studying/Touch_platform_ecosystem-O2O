const crypto = require("crypto");
const PlanOrder = require("../models/PlanOrder");
const Business = require("../models/Business");
const { fetchLivePlanPrices } = require("../utils/adminServerClient");
const { diffUnlockedFeatures } = require("../config/planLimits");
const { applyPlanChange } = require("../utils/planGate");

const ORDER_WINDOW_MS = 15 * 60 * 1000; // 15 phút

// Sinh nội dung chuyển khoản duy nhất, đúng format O2O<mã doanh nghiệp><TÊN GÓI><mã ngẫu nhiên>
const generateOrderCode = (businessId, plan) => {
  const shortBiz = businessId.toString().slice(-6).toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase(); // 4 ký tự
  return `O2O${shortBiz}${plan.toUpperCase()}${rand}`;
};

const buildBankInfo = () => ({
  bankId: process.env.SEPAY_BANK_ID || "",
  accountNumber: process.env.SEPAY_ACCOUNT_NO || "",
  accountName: process.env.SEPAY_ACCOUNT_NAME || "",
});

const buildQrUrl = (bank, amount, content) => {
  if (!bank.bankId || !bank.accountNumber) return null;
  return `https://img.vietqr.io/image/${bank.bankId}-${bank.accountNumber}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(
    content
  )}`;
};

// @desc  Tạo đơn nâng cấp gói (chờ chuyển khoản qua SePay)
// @route POST /api/payments
// body: { business, plan }
const createOrder = async (req, res) => {
  try {
    const { business: businessId, plan } = req.body;

    // Giá THẬT lấy trực tiếp từ Admin Server tại đúng thời điểm tạo đơn — đảm bảo khách luôn bị
    // tính đúng giá Super Admin đang niêm yết ngay lúc đó, kể cả khi giá vừa được đổi vài giây
    // trước (không cache). KHÔNG còn âm thầm rơi về PLAN_PRICES cũ nữa — với tiền thật, "chặn lại
    // và báo lỗi rõ ràng" an toàn hơn nhiều so với "cứ chạy tiếp với giá có thể đã lỗi thời".
    const livePrices = await fetchLivePlanPrices();
    if (!livePrices) {
      console.error(
        `[paymentController] Không lấy được giá từ Admin Server (${process.env.ADMIN_SERVER_URL || "http://localhost:5001"}) — chặn tạo đơn để tránh thu sai tiền. Kiểm tra Admin Server có đang chạy và ADMIN_SERVER_URL trong .env có đúng không.`
      );
      return res.status(503).json({
        message: "Hệ thống đang tạm thời không lấy được giá mới nhất, vui lòng thử lại sau giây lát.",
      });
    }
    const amount = livePrices[plan];
    console.log(`[paymentController] Tạo đơn nâng cấp ${plan}: giá lấy từ Admin Server = ${amount}đ`);
    if (!amount) return res.status(400).json({ message: "Gói không hợp lệ để thanh toán" });

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
    if (business.owner.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const orderCode = generateOrderCode(business._id, plan);
    const expiresAt = new Date(Date.now() + ORDER_WINDOW_MS);

    const order = await PlanOrder.create({ business: business._id, plan, amount, orderCode, expiresAt });

    const bank = buildBankInfo();
    res.status(201).json({
      orderId: order._id,
      plan,
      amount,
      transferContent: orderCode,
      bankId: bank.bankId,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      qrUrl: buildQrUrl(bank, amount, orderCode),
      expiresAt: order.expiresAt,
      status: order.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Không tạo được đơn thanh toán", error: err.message });
  }
};

// @desc  Poll trạng thái đơn hàng (mỗi 3s từ frontend) — tự đánh dấu hết hạn nếu quá 15 phút
// @route GET /api/payments/:id
const getOrderStatus = async (req, res) => {
  const order = await PlanOrder.findById(req.params.id).populate("business", "owner");
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (order.business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Không có quyền" });
  }

  if (order.status === "pending" && order.expiresAt < new Date()) {
    order.status = "expired";
    await order.save();
  }

  res.json({ status: order.status, plan: order.plan });
};

// @desc  [DEV/DEMO] Giả lập thanh toán thành công khi chưa nối SePay thật — dùng để test luồng UI
// @route POST /api/payments/:id/simulate-success
const simulateSuccess = async (req, res) => {
  const order = await PlanOrder.findById(req.params.id).populate("business");
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (order.business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Không có quyền" });
  }
  if (order.status !== "pending") return res.status(400).json({ message: "Đơn hàng không còn ở trạng thái chờ" });

  const oldPlan = order.business.plan;
  order.status = "paid";
  order.paidAt = new Date();
  await order.save();
  await applyPlanChange(order.business, order.plan);

  res.json({ status: "paid", unlockedFeatures: diffUnlockedFeatures(oldPlan, order.plan) });
};

// @desc  Webhook THẬT từ SePay — gọi khi có giao dịch chuyển khoản khớp vào tài khoản đã đăng ký.
//        PUBLIC (SePay gọi trực tiếp, không có JWT của admin) — xác thực qua SEPAY_WEBHOOK_TOKEN nếu có cấu hình.
// @route POST /api/payments/webhook/sepay
const sepayWebhook = async (req, res) => {
  const expectedToken = process.env.SEPAY_WEBHOOK_TOKEN;
  if (expectedToken) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${expectedToken}` && authHeader !== `Apikey ${expectedToken}`) {
      return res.status(401).json({ message: "Webhook token không hợp lệ" });
    }
  }

  try {
    // SePay gửi kèm nhiều field, quan trọng nhất là content (nội dung chuyển khoản) và transferAmount
    const { content = "", transferAmount, description = "" } = req.body;
    const rawContent = `${content} ${description}`.toUpperCase();

    const match = rawContent.match(/O2O[A-Z0-9]{10,20}/);
    if (!match) return res.status(200).json({ success: false, message: "Không tìm thấy mã đơn trong nội dung" });

    const order = await PlanOrder.findOne({ orderCode: match[0], status: "pending" }).populate("business");
    if (!order) return res.status(200).json({ success: false, message: "Không tìm thấy đơn hàng đang chờ khớp mã" });

    if (transferAmount && Number(transferAmount) < order.amount) {
      return res.status(200).json({ success: false, message: "Số tiền chuyển không khớp" });
    }

    const oldPlan = order.business.plan;
    order.status = "paid";
    order.paidAt = new Date();
    await order.save();
    await applyPlanChange(order.business, order.plan);
    diffUnlockedFeatures(oldPlan, order.plan); // tính sẵn cho log/telemetry sau này nếu cần

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false, error: err.message });
  }
};

module.exports = { createOrder, getOrderStatus, simulateSuccess, sepayWebhook };
