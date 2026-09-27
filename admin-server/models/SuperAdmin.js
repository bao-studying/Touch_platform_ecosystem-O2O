const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Tài khoản Chủ nền tảng (Super Admin) — HOÀN TOÀN tách biệt khỏi model Admin (chủ doanh nghiệp/Tenant).
// Đăng nhập qua trang /login (đăng nhập thường, tự nhận diện tài khoản Super Admin) hoặc /super-admin/login.
const superAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, default: "superadmin" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

superAdminSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
