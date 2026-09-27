const mongoose = require("mongoose");

// Singleton (chỉ 1 document) — các cấu hình hệ thống mà Super Admin có thể đổi qua giao diện.
// Lưu ý bảo mật: KHÔNG lưu API key/secret thật (SMTP password, payment secret key) trong DB dạng thường —
// những giá trị đó vẫn nằm trong biến môi trường (.env) của server. Model này chỉ lưu các trường hiển thị/
// không nhạy cảm (tên người gửi mail, email nhận thông báo...) + trạng thái "đã cấu hình hay chưa" để hiển thị.
const platformSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "main", unique: true },
    mailFromName: { type: String, default: "O2O Brand Platform" },
    notificationEmail: { type: String, default: "" }, // email nhận thông báo ticket mới / order mới
    supportZalo: { type: String, default: "" },
    supportHotline: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
