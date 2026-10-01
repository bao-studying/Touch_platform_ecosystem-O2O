const mongoose = require("mongoose");

// Hồ sơ mua hàng của khách (tenant đăng ký ở trang giới thiệu): số điện thoại, sổ địa chỉ giao hàng và giỏ hàng.
// Admin Server SỞ HỮU collection này (giống Order/Ticket) — KHÔNG ghi thêm field vào collection "admins" dùng chung
// với Client Server, để không đụng ranh giới dữ liệu đã nêu trong README.
const addressSchema = new mongoose.Schema({
  label: { type: String, default: "", trim: true, maxlength: 30 }, // vd: Nhà riêng, Văn phòng, Quán
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true },
  province: { type: String, default: "", trim: true, maxlength: 80 },
  district: { type: String, default: "", trim: true, maxlength: 80 },
  ward: { type: String, default: "", trim: true, maxlength: 80 },
  line: { type: String, required: true, trim: true, maxlength: 200 }, // số nhà, tên đường
  isDefault: { type: Boolean, default: false },
});

const customerProfileSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, unique: true },
    phone: { type: String, default: "", trim: true },
    addresses: [addressSchema],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "HardwareProduct", required: true },
        qty: { type: Number, required: true, min: 1, max: 99, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);
