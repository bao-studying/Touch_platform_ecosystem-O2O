import { UserPlus, ShoppingBag, LifeBuoy } from "lucide-react";

export const fmtVnd = (n) => `${(n || 0).toLocaleString("vi-VN")}đ`;

export const fmtCompactVnd = (n) => {
  const v = n || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}tr đ`;
  if (v >= 1_000) return `${Math.round(v / 1000)}k đ`;
  return fmtVnd(v);
};

// Thời gian tương đối kiểu "5 phút trước" — không cần thư viện ngoài, chỉ vài mốc phổ biến.
export const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const diffSec = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

// Tông màu cho theme tối (nền neutral-900 card) — dùng darkBg/darkTone ở dropdown thông báo & feed hoạt động.
export const ACTIVITY_META = {
  signup: { icon: UserPlus, darkBg: "bg-blue-500/15", darkTone: "text-blue-400" },
  order: { icon: ShoppingBag, darkBg: "bg-violet-500/15", darkTone: "text-violet-400" },
  ticket: { icon: LifeBuoy, darkBg: "bg-amber-500/15", darkTone: "text-amber-400" },
};

// Badge gói — pill translucent trên nền tối, khớp tông cam/vàng chủ đạo của thiết kế FinPoint.
export const PLAN_BADGE = {
  free: { label: "Free", className: "bg-white/8 text-neutral-300 ring-1 ring-white/10" },
  level1: { label: "Level 1", className: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20" },
  level2: { label: "Level 2", className: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20" },
  level3: {
    label: "Enterprise",
    className: "bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-900 font-semibold",
  },
};

// Màu đặc trưng theo gói — dùng cho bar chart / donut / dải màu nhỏ ở KPI card.
export const PLAN_COLORS = { free: "#525252", level1: "#3B82F6", level2: "#8B5CF6", level3: "#F59E0B" };
