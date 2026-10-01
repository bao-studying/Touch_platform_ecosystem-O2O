import { CheckCircle2, XCircle } from "lucide-react";

// Các thành phần nhỏ dùng chung cho khu Tài khoản / Giỏ hàng (nền sáng, tông espresso–cream của trang công khai).

export const inputClass =
  "mt-1.5 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-espresso-900 placeholder:text-espresso-600/40 focus:outline-none focus:ring-2 focus:ring-clay-500/30 disabled:bg-cream-100 disabled:text-espresso-600";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-espresso-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-espresso-600/70">{hint}</span>}
    </label>
  );
}

// Thông báo nội tuyến (thành công / lỗi) — hiện ngay tại nơi người dùng vừa thao tác.
export function Notice({ kind = "success", children }) {
  if (!children) return null;
  const ok = kind === "success";
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1 ${
        ok ? "bg-sage-500/10 text-espresso-800 ring-sage-500/25" : "bg-clay-500/10 text-clay-500 ring-clay-500/25"
      }`}
    >
      <Icon size={17} className={`mt-0.5 shrink-0 ${ok ? "text-sage-500" : "text-clay-500"}`} />
      <span className="flex-1">{children}</span>
    </div>
  );
}

export const vnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

export const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", tone: "bg-amber-400/20 text-amber-600" },
  in_production: { label: "Đang sản xuất", tone: "bg-blue-500/10 text-blue-600" },
  uid_loaded: { label: "Đã gắn chip NFC", tone: "bg-sage-500/15 text-sage-500" },
  delivered: { label: "Đã giao", tone: "bg-espresso-900/10 text-espresso-800" },
  cancelled: { label: "Đã hủy", tone: "bg-clay-500/10 text-clay-500" },
};
export const ORDER_FLOW = ["pending", "in_production", "uid_loaded", "delivered"];

export const shortCode = (id) => `#${String(id).slice(-6).toUpperCase()}`;

// ---- Thanh toán ----
export const isPaidStatus = (s) => s === "paid" || s === "manual_confirmed";
export const PAYMENT_METHOD_LABEL = { cod: "Thanh toán khi nhận hàng (COD)", bank_transfer: "Chuyển khoản online" };

// Nhãn ngắn + màu cho trạng thái thanh toán của 1 đơn.
export function paymentBadge(o) {
  if (isPaidStatus(o.paymentStatus)) return { label: "Đã thanh toán", tone: "text-sage-500" };
  if (o.paymentStatus === "partial") return { label: "Đã trả một phần", tone: "text-amber-600" };
  if (o.paymentMethod === "bank_transfer") return { label: "Chờ chuyển khoản", tone: "text-amber-600" };
  return { label: "Trả khi nhận hàng", tone: "text-espresso-600" };
}
