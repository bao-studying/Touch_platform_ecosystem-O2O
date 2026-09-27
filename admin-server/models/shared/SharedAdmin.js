const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ⚠️ RANH GIỚI DỮ LIỆU — đọc kỹ trước khi sửa file này:
// Đây KHÔNG PHẢI là bản copy code Client Server. Đây là khai báo Mongoose RIÊNG của Admin Server,
// trỏ vào CHUNG 1 collection "admins" trong CHUNG 1 MongoDB (MONGO_URI phải trùng ở cả 2 server).
// Admin Server sở hữu ghi các field: pendingPlan, isEmailVerified, emailVerifyToken, emailVerifyExpires,
// isLocked, lockedReason (những quyết định ở cấp nền tảng). Các field nghiệp vụ khác do Client Server sở hữu,
// Admin Server chỉ ĐỌC để hiển thị (không có UI nào ở Admin Server cho phép sửa chúng).
// Schema giữ ĐẦY ĐỦ field + hook hash password giống Client Server để 2 bên tạo/xác thực tài khoản
// tương thích nhau — đây là yêu cầu bắt buộc của kiến trúc "chung 1 collection", không phải sao chép logic app.
const sharedAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    pendingPlan: { type: String, enum: ["free", "level1", "level2", "level3"], default: "free" },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    isLocked: { type: Boolean, default: false },
    lockedReason: { type: String, default: "" },
  },
  { timestamps: true, collection: "admins" }
);

sharedAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

sharedAdminSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("Admin", sharedAdminSchema);
