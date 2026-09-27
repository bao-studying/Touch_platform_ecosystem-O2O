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

export const ACTIVITY_META = {
  signup: { icon: UserPlus, tone: "text-blue-600", bg: "bg-blue-50" },
  order: { icon: ShoppingBag, tone: "text-violet-600", bg: "bg-violet-50" },
  ticket: { icon: LifeBuoy, tone: "text-amber-600", bg: "bg-amber-50" },
};

export const PLAN_BADGE = {
  free: { label: "Free", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  level1: { label: "Level 1", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  level2: { label: "Level 2", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  level3: {
    label: "Enterprise",
    className: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/30",
  },
};
