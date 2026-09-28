// Ô nhập dùng chung cho các trang Auth (Login/Register) — nền tối kiểu "glass" trong suốt nhẹ,
// có icon minh hoạ bên trái. Khác input trắng thường dùng ở các form trong Admin Dashboard vì
// trang Auth cố tình dùng nền tối (bg-auth-surface) để tạo điểm nhấn cao cấp ngay từ cửa vào app.
export default function AuthField({ icon: Icon, className = "", ...rest }) {
  return (
    <div
      className={`flex items-center rounded-2xl bg-cream-50/5 border border-cream-50/15 transition-colors focus-within:border-amber-400/60 focus-within:bg-cream-50/10 ${className}`}
    >
      {Icon && <Icon size={17} className="ml-4 shrink-0 text-cream-50/40" />}
      <input
        {...rest}
        className={`w-full min-w-0 bg-transparent py-3.5 text-sm text-cream-50 placeholder:text-cream-100/40 focus:outline-none ${
          Icon ? "px-3" : "px-4"
        }`}
      />
    </div>
  );
}
