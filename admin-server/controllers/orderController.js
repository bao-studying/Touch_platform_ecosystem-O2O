const Order = require("../models/Order");
const HardwareProduct = require("../models/HardwareProduct");
const Business = require("../models/shared/SharedBusiness");
const { emitToTenant } = require("../sockets");

// ============ PHÍA TENANT (đã đăng nhập qua protectTenant) ============
// @route POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, note } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 sản phẩm" });
    }
    const products = await HardwareProduct.find({ _id: { $in: items.map((i) => i.productId) } });
    const productById = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    const orderItems = items.map((i) => {
      const product = productById[i.productId];
      if (!product) throw new Error("Sản phẩm không tồn tại hoặc đã ngừng bán");
      return { product: product._id, name: product.name, priceVnd: product.priceVnd, qty: Math.max(1, Number(i.qty) || 1) };
    });
    const totalVnd = orderItems.reduce((sum, i) => sum + i.priceVnd * i.qty, 0);
    const business = await Business.findOne({ owner: req.admin._id });

    const order = await Order.create({
      tenant: req.admin._id,
      business: business?._id,
      items: orderItems,
      totalVnd,
      shippingAddress: shippingAddress || "",
      note: note || "",
      statusHistory: [{ status: "pending" }],
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message || "Không thể tạo đơn hàng" });
  }
};

// @route GET /api/orders/mine
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ tenant: req.admin._id }).sort({ createdAt: -1 });
  res.json(orders);
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
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  order.status = status;
  if (assignedUid !== undefined) order.assignedUid = assignedUid;
  order.statusHistory.push({ status });
  await order.save();
  emitToTenant(order.tenant.toString(), "order:status", { orderId: order._id, status: order.status });
  res.json(order);
};

// @route PUT /api/super-admin/orders/:id/confirm-payment
const confirmManualPayment = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  order.paymentStatus = "manual_confirmed";
  await order.save();
  emitToTenant(order.tenant.toString(), "order:status", { orderId: order._id, paymentStatus: order.paymentStatus });
  res.json(order);
};

module.exports = { createOrder, getMyOrders, listAllOrders, updateOrderStatus, confirmManualPayment };
