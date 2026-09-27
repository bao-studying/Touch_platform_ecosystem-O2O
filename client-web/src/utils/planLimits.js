// Mirror của backend/config/planLimits.js — CHỈ dùng để hiển thị đúng trạng thái khóa/mở trên giao diện.
// Backend vẫn là nơi thực thi thật (xem planGate.js), đổi ở đây không "mở khóa" được gì cả.
export const PLAN_LIMITS = {
  free: {
    maxSocialLinks: 2,
    allowedAnimations: ["stationary", "bouncing"],
    hasLoyalty: false,
    hasCrmExport: false,
    hasSmartReview: false,
    hasMultiBranch: false,
    hasFontPicker: false,
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

export const PLAN_LABELS = { free: "Free", level1: "Level 1", level2: "Level 2", level3: "Level 3" };

export const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

// Gói tối thiểu cần để mở 1 cờ tính năng — dùng để hiển thị "🔒 Cần Level X"
export const minPlanFor = (featureKey) => {
  const order = ["free", "level1", "level2", "level3"];
  for (const p of order) {
    if (PLAN_LIMITS[p][featureKey]) return p;
  }
  return "level3";
};

// Mirror của diffUnlockedFeatures backend — dùng để tính toast "Đã mở khóa..." sau khi thanh toán
// thành công qua SePay (lúc đó chỉ biết được qua polling, không có response trực tiếp từ webhook).
const FEATURE_LABELS = {
  hasLoyalty: "Thu thập Khách hàng thân thiết (Loyalty)",
  hasCrmExport: "CRM + Xuất CSV",
  hasSmartReview: "Smart Review (đánh giá thông minh)",
  hasMultiBranch: "Quản lý đa chi nhánh",
  hasFontPicker: "Chọn kiểu chữ thương hiệu",
};

export const diffUnlockedFeatures = (oldPlan, newPlan) => {
  const before = getPlanLimits(oldPlan);
  const after = getPlanLimits(newPlan);
  const unlocked = [];
  Object.keys(FEATURE_LABELS).forEach((key) => {
    if (!before[key] && after[key]) unlocked.push(FEATURE_LABELS[key]);
  });
  if (after.maxSocialLinks > before.maxSocialLinks) unlocked.push("Không giới hạn Social Links");
  if (after.allowedAnimations.length > before.allowedAnimations.length && after.allowedAnimations.includes("orbit")) {
    unlocked.push("Hiệu ứng Marquee/Orbit cho Social Links");
  }
  if (before.showsAds && !after.showsAds) unlocked.push("Loại bỏ quảng cáo");
  return unlocked;
};
