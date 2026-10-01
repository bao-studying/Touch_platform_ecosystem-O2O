const mongoose = require("mongoose");

// Thông báo hiển thị ở chuông trên header — 2 nhóm người nhận:
//  • audience "tenant"     : gửi riêng cho 1 khách (trường `tenant`) — trạng thái đơn, thanh toán, phản hồi hỗ trợ...
//  • audience "superadmin" : dùng chung cho mọi Super Admin — đơn mới, tiền về, ticket mới, khách đăng ký...
// Trạng thái đã đọc lưu theo từng người (`readBy`), nên nhiều Super Admin không "đọc hộ" nhau.
const NOTIFICATION_TYPES = ["order", "payment", "ticket", "contact", "signup", "system"];

const notificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ["tenant", "superadmin"], required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // chỉ có khi audience = "tenant"
    type: { type: String, enum: NOTIFICATION_TYPES, default: "system" },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, default: "", maxlength: 300 },
    link: { type: String, default: "" }, // đường dẫn trong app để mở khi bấm vào thông báo
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, tenant: 1, createdAt: -1 });
// Tự dọn thông báo cũ sau 90 ngày để collection không phình mãi.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
