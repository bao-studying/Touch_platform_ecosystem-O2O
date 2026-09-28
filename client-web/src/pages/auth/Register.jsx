import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee, User, Mail, Loader2, ArrowRight } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AuthField from "../../components/auth/AuthField";
import PasswordField from "../../components/auth/PasswordField";
import AuthSidePanel from "../../components/auth/AuthSidePanel";

// Trang Đăng ký — cùng bố cục/tông màu với Login.jsx (đồng bộ theme) để cả 2 trang Auth cảm giác
// như 1 khối liền mạch, đúng yêu cầu "đồng bộ tông màu và chủ đề với nhau".
export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/admin/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const comingSoon = (label) => showToast(`${label} sẽ sớm được hỗ trợ — hiện vui lòng dùng email.`, "info");

  return (
    <div className="min-h-screen bg-auth-surface lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen lg:min-h-0 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">
        <div className="w-full max-w-sm mx-auto animate-fade-in">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <span className="w-10 h-10 rounded-xl bg-cream-50/10 ring-1 ring-cream-50/15 text-cream-50 flex items-center justify-center">
              <Coffee size={19} />
            </span>
            <span className="font-display text-lg text-cream-50">O2O Brand</span>
          </div>

          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 mb-3">BẮT ĐẦU MIỄN PHÍ</p>
          <h1 className="font-display text-3xl text-cream-50 mb-2">Tạo tài khoản</h1>
          <p className="text-sm text-cream-100/60 mb-7">Quảng bá thương hiệu qua NFC/QR chỉ trong vài phút.</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => comingSoon("Đăng ký với Google")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-cream-50/5 border border-cream-50/15 py-3 text-sm text-cream-50 hover:bg-cream-50/10 transition-colors"
            >
              <SiGoogle size={15} /> Google
            </button>
            <button
              type="button"
              onClick={() => comingSoon("Đăng ký với Apple")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-cream-50/5 border border-cream-50/15 py-3 text-sm text-cream-50 hover:bg-cream-50/10 transition-colors"
            >
              <SiApple size={15} /> Apple
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-cream-50/10" />
            <span className="text-[11px] text-cream-100/40 shrink-0">Hoặc dùng email</span>
            <div className="h-px flex-1 bg-cream-50/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AuthField
              icon={User}
              required
              autoComplete="name"
              placeholder="Họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <AuthField
              icon={Mail}
              required
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <PasswordField
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <PasswordField
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />

            {error && (
              <p className="text-xs text-clay-500 bg-clay-500/10 ring-1 ring-clay-500/20 rounded-lg px-3 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-espresso-950 py-3.5 text-sm font-semibold shadow-lg shadow-amber-500/10 disabled:opacity-60 hover:brightness-105 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>

            <p className="text-[11px] text-center text-cream-100/40 leading-relaxed pt-1">
              Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của O2O Brand.
            </p>
          </form>

          <p className="text-center text-sm text-cream-100/60 mt-6">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      <AuthSidePanel />
    </div>
  );
}
