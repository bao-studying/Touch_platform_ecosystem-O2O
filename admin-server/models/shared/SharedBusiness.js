const mongoose = require("mongoose");

// Trỏ chung vào collection "businesses". Admin Server chỉ ĐỌC (Tenants, Overview/MRR) — việc TẠO Business
// vẫn do Client Server làm (bước Onboarding), Admin Server không có UI nào tạo mới Business.
// plan/planExpiresAt/planHistory: Admin Server có quyền đọc để tính MRR/churn; không có tính năng
// "đổi gói hộ tenant" ở round này nên chưa cần ghi — để sẵn schema đầy đủ cho việc mở rộng sau.
const sharedBusinessSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    name: { type: String },
    slug: { type: String },
    plan: { type: String, enum: ["free", "level1", "level2", "level3"], default: "free" },
    planExpiresAt: { type: Date, default: null },
    planHistory: [
      {
        plan: { type: String, enum: ["free", "level1", "level2", "level3"] },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, collection: "businesses", strict: false } // strict:false — không chạm/xóa field nào khác của Client Server mà Admin Server không khai báo ở đây
);

module.exports = mongoose.model("Business", sharedBusinessSchema);
