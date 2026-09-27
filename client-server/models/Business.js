const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // dùng cho /p/:slug
    logoUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 300 },
    mascotUrl: { type: String, default: "" }, // ảnh mô hình 3D linh vật cho luồng kích hoạt NFC

    googleMapsLink: { type: String, default: "" },
    googlePlaceId: { type: String, default: "" }, // dùng để nhảy thẳng vào khung "Viết đánh giá" Google Maps
    shopeeLink: { type: String, default: "" },
    wifiInfo: { type: String, default: "" },
    hotline: { type: String, default: "" },

    // Nội dung hiển thị trên widget Loyalty (Membership) ở Landing Page
    loyaltyOfferText: { type: String, default: "Nhận Voucher 10% — Đăng ký thành viên" },

    // Khối "Góp ý riêng" ở Landing Page — khách gửi thẳng cho chủ quán, không qua chấm sao
    privateFeedbackEnabled: { type: Boolean, default: true },
    feedbackPromptText: { type: String, default: "Gửi góp ý riêng cho chúng tôi", maxlength: 100 },

    // Ngưỡng sao để redirect ra review công khai (mặc định 4) — chỉ áp dụng khi gói có Smart Review
    reviewThreshold: { type: Number, default: 4, min: 1, max: 5 },

    // Branding & Theme — CHỈ áp dụng cho Landing Page công khai, không áp dụng cho Admin Dashboard
    theme: {
      primaryColor: { type: String, default: "#4A2E1F" }, // mặc định = espresso-800
      buttonStyle: { type: String, enum: ["rounded", "square"], default: "rounded" },
      fontFamily: { type: String, enum: ["fraunces", "poppins", "quicksand"], default: "fraunces" }, // Level 1+
    },

    plan: {
      type: String,
      enum: ["free", "level1", "level2", "level3"],
      default: "free",
    },
    // Ngày hết hạn gói hiện tại (null = gói Free, không hết hạn). Hạ về Free tự động khi quá hạn (lazy check).
    planExpiresAt: { type: Date, default: null },
    // Lịch sử nâng cấp — hiển thị ở trang Cài đặt tài khoản
    planHistory: [
      {
        plan: { type: String, enum: ["free", "level1", "level2", "level3"] },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // Level 3: quản lý đa chi nhánh
    branches: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);
