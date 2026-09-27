const mongoose = require("mongoose");

// Đơn hàng mua phần cứng decor — đặt bởi Tenant (chủ doanh nghiệp) đã có tài khoản đăng nhập.
// Luồng trạng thái: pending → in_production → uid_loaded → delivered (có thể cancelled ở bất kỳ bước nào trước delivered).
const ORDER_STATUSES = ["pending", "in_production", "uid_loaded", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "HardwareProduct" },
        name: { type: String, required: true }, // snapshot tên tại thời điểm đặt
        priceVnd: { type: Number, required: true }, // snapshot giá tại thời điểm đặt
        qty: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
    totalVnd: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    // Thanh toán: demo hiện tại là xác nhận thủ công bởi Super Admin. Cổng SePay tự động sẽ nối vào round sau.
    paymentStatus: { type: String, enum: ["unpaid", "manual_confirmed"], default: "unpaid" },
    shippingAddress: { type: String, default: "" },
    note: { type: String, default: "" },
    assignedUid: { type: String, default: "" }, // UID chip gán cho đơn khi ở bước "Nạp UID chip"
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
