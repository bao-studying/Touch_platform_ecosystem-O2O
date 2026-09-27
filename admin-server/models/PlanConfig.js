const mongoose = require("mongoose");

// Nguồn dữ liệu ĐỘNG cho các gói SaaS — Super Admin sửa ở đây (CRUD qua Billing & Plans) thì mọi nơi hiển thị
// giá (Store công khai, Store trong Admin Dashboard, bảng giá Landing Page) đều cập nhật theo, không cần sửa code.
// Lưu ý: đây là dữ liệu HIỂN THỊ + giá tiền. Ma trận GIỚI HẠN TÍNH NĂNG thật sự (chặn ở backend) vẫn nằm ở
// config/planLimits.js như cũ để không phá vỡ logic khoá tính năng đã có — planKey ở đây phải khớp key bên đó.
const planConfigSchema = new mongoose.Schema(
  {
    planKey: { type: String, required: true, unique: true, enum: ["free", "level1", "level2", "level3"] },
    name: { type: String, required: true, trim: true },
    priceVnd: { type: Number, required: true, default: 0 }, // 0 = miễn phí
    priceLabel: { type: String, default: "" }, // vd "99.000đ/tháng" — cho phép ghi khoảng giá tự do nếu cần
    tagline: { type: String, default: "" },
    features: [{ type: String }],
    branchLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }, // ẩn/hiện gói trên trang công khai mà không cần xoá
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlanConfig", planConfigSchema);
