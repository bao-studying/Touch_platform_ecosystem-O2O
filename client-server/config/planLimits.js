// Ma trận tính năng theo từng gói. Đây là nguồn xác thực DUY NHẤT ở backend —
// mọi controller phải kiểm tra qua đây, không được tin tưởng vào giao diện.
const PLAN_ORDER = ["free", "level1", "level2", "level3"];

const PLAN_LIMITS = {
  free: {
    maxSocialLinks: 2,
    allowedAnimations: ["stationary", "bouncing"],
    hasLoyalty: false,
    hasCrmExport: false,
    hasSmartReview: false,
    hasMultiBranch: false,
    hasFontPicker: false,
    // Mô hình thu nhập: hiển thị quảng cáo trên Landing Page ở gói Free & Level 1 để duy trì máy chủ.
    // Hiện tại chỉ là placeholder (chưa gắn mạng quảng cáo thật) — xem docs/ADS_INTEGRATION.md.
    showsAds: true,
  },
  level1: {
    maxSocialLinks: Infinity,
    allowedAnimations: ["stationary", "bouncing"],
    hasLoyalty: true,
    hasCrmExport: true,
    hasSmartReview: false,
    hasMultiBranch: false,
    hasFontPicker: true,
    showsAds: true,
  },
  level2: {
    maxSocialLinks: Infinity,
    allowedAnimations: ["stationary", "bouncing", "marquee", "orbit"],
    hasLoyalty: true,
    hasCrmExport: true,
    hasSmartReview: true,
    hasMultiBranch: false,
    hasFontPicker: true,
    showsAds: false,
  },
  level3: {
    maxSocialLinks: Infinity,
    allowedAnimations: ["stationary", "bouncing", "marquee", "orbit"],
    hasLoyalty: true,
    hasCrmExport: true,
    hasSmartReview: true,
    hasMultiBranch: true,
    hasFontPicker: true,
    showsAds: false,
  },
};

const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

// So sánh 2 gói để tính ra các tính năng MỚI được mở khi nâng cấp (dùng cho toast ăn mừng ở Store)
const FEATURE_LABELS = {
  hasLoyalty: "Thu thập Khách hàng thân thiết (Loyalty)",
  hasCrmExport: "CRM + Xuất CSV",
  hasSmartReview: "Smart Review (đánh giá thông minh)",
  hasMultiBranch: "Quản lý đa chi nhánh",
  hasFontPicker: "Chọn kiểu chữ thương hiệu",
};

const diffUnlockedFeatures = (oldPlan, newPlan) => {
  const before = getPlanLimits(oldPlan);
  const after = getPlanLimits(newPlan);
  const unlocked = [];
  Object.keys(FEATURE_LABELS).forEach((key) => {
    if (!before[key] && after[key]) unlocked.push(FEATURE_LABELS[key]);
  });
  if (after.maxSocialLinks > before.maxSocialLinks) unlocked.push("Không giới hạn Social Links");
  if (
    after.allowedAnimations.length > before.allowedAnimations.length &&
    after.allowedAnimations.includes("orbit")
  ) {
    unlocked.push("Hiệu ứng Marquee/Orbit cho Social Links");
  }
  if (before.showsAds && !after.showsAds) unlocked.push("Loại bỏ quảng cáo");
  return unlocked;
};

module.exports = { PLAN_ORDER, PLAN_LIMITS, getPlanLimits, diffUnlockedFeatures, FEATURE_LABELS };
