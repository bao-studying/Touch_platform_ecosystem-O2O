import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, inputClass } from "./ui";

// Ô mật khẩu có nút hiện/ẩn, theme sáng (PasswordField có sẵn trong components/auth là theme tối cho trang đăng nhập).
export default function PasswordFieldLight({ label, hint, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          required
          minLength={6}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-espresso-600 hover:text-espresso-900"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </Field>
  );
}
