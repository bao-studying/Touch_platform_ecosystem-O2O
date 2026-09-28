import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee, Mail, Loader2, ArrowRight } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AuthField from "../../components/auth/AuthField";
import PasswordField from "../../components/auth/PasswordField";
import AuthSidePanel from "../../components/auth/AuthSidePanel";

// Trang Đăng nhập — bố cục 2 cột trên desktop (form trái / panel thương hiệu phải), 1 cột full-bleed
// nền tối trên mobile. Google/Apple hiện chưa có backend OAuth thật nên chỉ báo "sắp hỗ trợ" qua
// toast khi bấm, thay vì làm nút chết không phản hồi gì.
export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const comingSoon = (label) => showToast(`${label} sẽ sớm được hỗ trợ — hiện vui lòng dùng email.`, "info");

  return (
    <div className="min-h-screen bg-auth-surface lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen lg:min-h-0 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">
        <div className="w-full max-w-sm mx-auto animate-fade-in">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <span className="w-10 h-10 rounded-xl bg-cream-50/10 ring-1 ring-cream-50/15 text-cream-50 flex items-center justify-center">
              <Coffee size={19} />
            </span>
            <span className="font-display text-lg text-cream-50">O2O Brand</span>
          </div>

          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 mb-3">CHÀO MỪNG TRỞ LẠI</p>
          <h1 className="font-display text-3xl text-cream-50 mb-2">Đăng nhập</h1>
          <p className="text-sm text-cream-100/60 mb-8">Tiếp tục quản lý thương hiệu O2O của bạn.</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => comingSoon("Đăng nhập với Google")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-cream-50/5 border border-cream-50/15 py-3 text-sm text-cream-50 hover:bg-cream-50/10 transition-colors"
            >
              <SiGoogle size={15} /> Google
            </button>
            <button
              type="button"
              onClick={() => comingSoon("Đăng nhập với Apple")}
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
              autoComplete="current-password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => comingSoon("Khôi phục mật khẩu")}
                className="text-xs text-cream-100/55 hover:text-amber-400 transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <p className="text-xs text-clay-500 bg-clay-500/10 ring-1 ring-clay-500/20 rounded-lg px-3 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-espresso-950 py-3.5 text-sm font-semibold shadow-lg shadow-amber-500/10 disabled:opacity-60 hover:brightness-105 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-sm text-cream-100/60 mt-8">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      <AuthSidePanel />
    </div>
  );
}
