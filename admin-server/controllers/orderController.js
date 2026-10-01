const mongoose = require("mongoose");
const Order = require("../models/Order");
const HardwareProduct = require("../models/HardwareProduct");
const CustomerProfile = require("../models/CustomerProfile");
const Business = require("../models/shared/SharedBusiness");
const { emitToTenant } = require("../sockets");
const { pickAddress, validateAddress, formatAddress } = require("../utils/shipping");
const { PAYMENT_WINDOW_MS, generatePaymentCode, getBankConfig, isBankConfigured, canUseBankTransfer, buildPaymentInfo } = require("../utils/payment");
const { processTransfer } = require("./paymentController");
const { shortCode, fmtVnd, isPaid } = require("../utils/orderFormat");
const { notifyTenant, notifySuperAdmins } = require("../utils/notify");
const { ORDER_STATUSES } = Order;

// Đơn kèm hướng dẫn thanh toán (QR, số tài khoản...) nếu là đơn chuyển khoản còn nợ tiền.
const withPayment = (order, cfg) => {
  const obj = order.toObject ? order.toObject() : order;
  const stillOwing = obj.paymentStatus === "unpaid" || obj.paymentStatus === "partial";
  return { ...obj, payment: stillOwing && obj.status !== "cancelled" ? buildPaymentInfo(order, cfg) : null };
};

// ============ PHÍA TENANT (đã đăng nhập qua protectTenant) ============
// @route POST /api/orders
// Body: { items: [{ productId, qty }], addressId?  |  shipping?: {...}, note?, paymentMethod?: "cod" | "bank_transfer" }
// Bắt buộc có địa chỉ giao hàng: chọn từ sổ địa chỉ (addressId) hoặc nhập trực tiếp (shipping).
// Đơn "bank_transfer" trả kèm `payment` (QR SePay + số tài khoản + nội dung chuyển khoản) để khách thanh toán ngay.
const createOrder = async (req, res) => {
  try {
    const { items, addressId, shipping, note } = req.body;
    const paymentMethod = req.body.paymentMethod || "cod";
    if (!["cod", "bank_transfer"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Hình thức thanh toán không hợp lệ" });
    }
    const bankCfg = await getBankConfig();
    if (paymentMethod === "bank_transfer" && !canUseBankTransfer(bankCfg)) {
      return res.status(400).json({ message: "Chuyển khoản online hiện chưa khả dụng, vui lòng chọn thanh toán khi nhận hàng (COD)" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng đang trống, vui lòng chọn ít nhất 1 sản phẩm" });
    }
    if (items.some((i) => !mongoose.isValidObjectId(i?.productId))) {
      return res.status(400).json({ message: "Có sản phẩm không hợp lệ trong giỏ hàng" });
    }

    // --- Địa chỉ giao hàng ---
    let recipient;
    if (addressId) {
      if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ message: "Địa chỉ không hợp lệ" });
      const profile = await CustomerProfile.findOne({ tenant: req.admin._id });
      const saved = profile?.addresses.id(addressId);
      if (!saved) return res.status(400).json({ message: "Không tìm thấy địa chỉ đã chọn, vui lòng chọn lại" });
      recipient = pickAddress(saved.toObject());
    } else {
      recipient = pickAddress(shipping);
    }
    const addressError = validateAddress(recipient);
    if (addressError) return res.status(400).json({ message: addressError });

    // --- Sản phẩm (chỉ nhận sản phẩm đang bán, giá lấy từ DB — không tin giá client gửi lên) ---
    const products = await HardwareProduct.find({ _id: { $in: items.map((i) => i.productId) }, isActive: true });
    const productById = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    const orderItems = items.map((i) => {
      const product = productById[i.productId];
      if (!product) throw new Error("Có sản phẩm không tồn tại hoặc đã ngừng bán, vui lòng làm mới giỏ hàng");
      return {
        product: product._id,
        name: product.name,
        priceVnd: product.priceVnd,
        qty: Math.min(99, Math.max(1, Math.floor(Number(i.qty)) || 1)),
      };
    });
    const totalVnd = orderItems.reduce((sum, i) => sum + i.priceVnd * i.qty, 0);
    const business = await Business.findOne({ owner: req.admin._id });

    const order = await Order.create({
      tenant: req.admin._id,
      business: business?._id,
      items: orderItems,
      totalVnd,
      shipping: recipient,
      // Chuỗi 1 dòng để trang Đơn hàng của Super Admin hiển thị luôn người nhận + SĐT + địa chỉ.
      shippingAddress: `${recipient.fullName} · ${recipient.phone} · ${formatAddress(recipient)}`,
      note: String(note || "").trim().slice(0, 300),
      paymentMethod,
      paymentCode: paymentMethod === "bank_transfer" ? await generatePaymentCode() : undefined,
      paymentExpiresAt: paymentMethod === "bank_transfer" ? new Date(Date.now() + PAYMENT_WINDOW_MS) : undefined,
      statusHistory: [{ status: "pending" }],
    });

    // Đặt xong → dọn giỏ hàng đã lưu trên server.
    await CustomerProfile.updateOne({ tenant: req.admin._id }, { $set: { cart: [] } });

    const code = shortCode(order._id);
    const isBank = paymentMethod === "bank_transfer";
    notifyTenant(req.admin._id, {
      type: "order",
      title: `Đã tạo đơn hàng ${code}`,
      body: isBank ? `Vui lòng chuyển khoản ${fmtVnd(totalVnd)} để chúng tôi xử lý đơn.` : `Thanh toán khi nhận hàng · ${fmtVnd(totalVnd)}.`,
      link: "/account?tab=orders",
    });
    notifySuperAdmins({
      type: "order",
      title: `Đơn hàng mới ${code} · ${fmtVnd(totalVnd)}`,
      body: `${req.admin.name} · ${isBank ? "Chuyển khoản (chờ tiền về)" : "COD"}`,
      link: "/super-admin/orders",
    });

    res.status(201).json(withPayment(order, bankCfg));
  } catch (err) {
    res.status(400).json({ message: err.message || "Không thể tạo đơn hàng" });
  }
};

// @route GET /api/orders/mine
const getMyOrders = async (req, res) => {
  const [orders, cfg] = await Promise.all([
    Order.find({ tenant: req.admin._id }).populate("items.product", "imageUrl").sort({ createdAt: -1 }),
    getBankConfig(),
  ]);
  res.json(orders.map((o) => withPayment(o, cfg)));
};

// @route POST /api/orders/:id/renew-payment   — làm mới mã QR khi hết hạn 15 phút (mã/nội dung chuyển khoản giữ nguyên)
const renewPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Mã đơn không hợp lệ" });
  const order = await Order.findOne({ _id: req.params.id, tenant: req.admin._id });
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (order.paymentMethod !== "bank_transfer" || isPaid(order) || order.status === "cancelled") {
    return res.status(400).json({ message: "Đơn này không cần làm mới mã thanh toán" });
  }
  order.paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MS);
  await order.save();
  res.json(withPayment(order, await getBankConfig()));
};

// @route POST /api/orders/:id/simulate-payment   — [DEV/DEMO] giả lập "đã nhận tiền" khi CHƯA cấu hình tài khoản SePay thật,
// giống nút giả lập ở Client Web. Chặn hẳn khi đã có tài khoản thật hoặc đang chạy production — nếu không khách nào cũng tự xác nhận được.
const simulatePayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Mã đơn không hợp lệ" });
  const cfg = await getBankConfig();
  if (isBankConfigured(cfg) || process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Đã cấu hình SePay thật — không dùng thanh toán giả lập" });
  }
  const order = await Order.findOne({ _id: req.params.id, tenant: req.admin._id });
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (order.paymentMethod !== "bank_transfer" || isPaid(order) || order.status === "cancelled") {
    return res.status(400).json({ message: "Đơn hàng không còn ở trạng thái chờ thanh toán" });
  }
  // Đi qua đúng đường xử lý của giao dịch thật (sổ giao dịch, thông báo, realtime) để demo phản ánh đúng luồng thật.
  const out = await processTransfer({
    id: `SIM-${order._id}-${Date.now()}`,
    gateway: "SIMULATED",
    transferType: "in",
    transferAmount: Math.max(1, order.totalVnd - (order.paidVnd || 0)),
    content: order.paymentCode,
    code: order.paymentCode,
  });
  if (out.status !== 200) return res.status(out.status).json(out.body);
  res.json(withPayment(await Order.findById(order._id), cfg));
};

// @route GET /api/orders/:id   — 1 đơn của chính khách (màn hình thanh toán QR dùng để kiểm tra đã nhận tiền chưa)
const getMyOrder = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Mã đơn không hợp lệ" });
  const order = await Order.findOne({ _id: req.params.id, tenant: req.admin._id });
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  res.json(withPayment(order, await getBankConfig()));
};

// ============ PHÍA SUPER ADMIN ============
// @route GET /api/super-admin/orders
const listAllOrders = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter).populate("tenant", "name email").sort({ createdAt: -1 });
  res.json(orders);
};

// @route PUT /api/super-admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  const { status, assignedUid } = req.body;
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  order.status = status;
  if (assignedUid !== undefined) order.assignedUid = assignedUid;
  order.statusHistory.push({ status });
  await order.save();
  emitToTenant(order.tenant.toString(), "order:status", { orderId: order._id, status: order.status });

  const code = shortCode(order._id);
  const MESSAGES = {
    in_production: [`Đơn ${code} đang được sản xuất`, "Chúng tôi đang chuẩn bị vật phẩm decor của bạn."],
    uid_loaded: [`Đơn ${code} đã gắn chip NFC`, "Vật phẩm đã nạp UID chip, sắp được giao."],
    delivered: [`Đơn ${code} đã giao`, "Cảm ơn bạn đã tin dùng O2O Brand!"],
    cancelled: [`Đơn ${code} đã bị hủy`, "Nếu cần hỗ trợ, vui lòng liên hệ O2O."],
  };
  if (MESSAGES[status]) {
    notifyTenant(order.tenant, { type: "order", title: MESSAGES[status][0], body: MESSAGES[status][1], link: "/account?tab=orders" });
  }
  res.json(order);
};

// @route PUT /api/super-admin/orders/:id/confirm-payment
const confirmManualPayment = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  order.paymentStatus = "manual_confirmed";
  order.paymentSource = "manual";
  order.paidVnd = order.totalVnd;
  order.paidAt = new Date();
  await order.save();
  emitToTenant(order.tenant.toString(), "order:status", { orderId: order._id, paymentStatus: order.paymentStatus });
  notifyTenant(order.tenant, {
    type: "payment",
    title: `Đã xác nhận thanh toán đơn ${shortCode(order._id)}`,
    body: `Số tiền ${fmtVnd(order.totalVnd)}.`,
    link: "/account?tab=orders",
  });
  res.json(order);
};

module.exports = { createOrder, getMyOrders, getMyOrder, renewPayment, simulatePayment, listAllOrders, updateOrderStatus, confirmManualPayment };
