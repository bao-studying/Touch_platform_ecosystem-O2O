import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

// Giống AuthField nhưng thêm nút ẩn/hiện mật khẩu — tách riêng component vì cần state "visible"
// và icon khoá luôn cố định (không nhận prop icon tuỳ ý như AuthField).
export default function PasswordField({ className = "", ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`flex items-center rounded-2xl bg-cream-50/5 border border-cream-50/15 transition-colors focus-within:border-amber-400/60 focus-within:bg-cream-50/10 ${className}`}
    >
      <Lock size={17} className="ml-4 shrink-0 text-cream-50/40" />
      <input
        {...rest}
        type={visible ? "text" : "password"}
        className="w-full min-w-0 bg-transparent px-3 py-3.5 text-sm text-cream-50 placeholder:text-cream-100/40 focus:outline-none"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="mr-3.5 shrink-0 text-cream-100/45 hover:text-cream-50 transition-colors"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
