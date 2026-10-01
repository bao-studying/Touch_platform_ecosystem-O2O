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
    // Thanh toán:
    //  • cod           : trả tiền mặt khi nhận hàng — Super Admin bấm "Đã thu tiền" sau khi giao.
    //  • bank_transfer : chuyển khoản online qua QR — SePay báo về webhook thì tự chuyển "paid".
    // paymentStatus: unpaid → (partial nếu chuyển thiếu) → paid (SePay tự động) | manual_confirmed (Super Admin xác nhận tay).
    paymentMethod: { type: String, enum: ["cod", "bank_transfer"], default: "cod" },
    paymentStatus: { type: String, enum: ["unpaid", "partial", "paid", "manual_confirmed"], default: "unpaid" },
    paymentCode: { type: String, unique: true, sparse: true }, // O2OHW + 8 ký tự = nội dung chuyển khoản, dùng để đối soát webhook
    paymentExpiresAt: { type: Date }, // hạn của mã QR hiện tại (15 phút, khách làm mới được). Quá hạn VẪN nhận tiền nếu khách đã chuyển.
    paidVnd: { type: Number, default: 0 }, // tổng tiền đã nhận (cộng dồn nếu khách chuyển nhiều lần)
    paidAt: { type: Date },
    paymentSource: { type: String, enum: ["", "sepay", "manual"], default: "" },
    shippingAddress: { type: String, default: "" },
    // Snapshot người nhận tại thời điểm đặt (khách sửa/xoá địa chỉ sau này cũng không ảnh hưởng đơn cũ).
    shipping: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      province: { type: String, default: "" },
      district: { type: String, default: "" },
      ward: { type: String, default: "" },
      line: { type: String, default: "" },
    },
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
