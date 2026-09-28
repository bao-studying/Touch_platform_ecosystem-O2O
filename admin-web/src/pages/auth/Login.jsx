import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Coffee, Mail, Loader2, ArrowRight } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useAuth } from "../../context/AuthContext";
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext";
import { useToast } from "../../components/superadmin/Toast";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import PasswordField from "../../components/auth/PasswordField";

// Đăng nhập thường — dùng cho cả tài khoản Tenant (chủ doanh nghiệp) lẫn tài khoản Super Admin (chủ nền tảng).
// Thử đăng nhập Tenant trước; nếu sai email/mật khẩu, thử tiếp với tài khoản Super Admin trước khi báo lỗi.
// Nếu là tài khoản Super Admin, chuyển thẳng vào /super-admin/dashboard thay vì trang Dashboard doanh nghiệp.
// Giao diện dùng chung với client-web (AuthLayout + AuthField + PasswordField + AuthSidePanel).
export default function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const { login: loginSuperAdmin } = useSuperAdminAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(searchParams.get("redirect") || "/admin");
      return;
    } catch (err) {
      // Sai email/mật khẩu ở phía Tenant → thử lại với tài khoản Super Admin trước khi báo lỗi.
      if (err.response?.status === 401) {
        try {
          await loginSuperAdmin(form.email, form.password);
          navigate("/super-admin/dashboard");
          return;
        } catch {
          // Không khớp tài khoản Super Admin nào — rơi xuống báo lỗi chung bên dưới.
        }
      }
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const comingSoon = (label) => toast.info(label, "Sẽ sớm được hỗ trợ — hiện vui lòng dùng email.");

  return (
    <>
      <div className="mb-10 flex items-center gap-2.5 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50/10 text-cream-50 ring-1 ring-cream-50/15">
          <Coffee size={19} />
        </span>
        <span className="font-display text-lg text-cream-50">O2O Brand</span>
      </div>

      <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-400">CHÀO MỪNG TRỞ LẠI</p>
      <h1 className="mb-2 font-display text-3xl text-cream-50">Đăng nhập</h1>
      <p className="mb-8 text-sm text-cream-100/60">Tiếp tục quản lý thương hiệu O2O của bạn.</p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => comingSoon("Đăng nhập với Google")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-cream-50/15 bg-cream-50/5 py-3 text-sm text-cream-50 transition-colors hover:bg-cream-50/10"
        >
          <SiGoogle size={15} /> Google
        </button>
        <button
          type="button"
          onClick={() => comingSoon("Đăng nhập với Apple")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-cream-50/15 bg-cream-50/5 py-3 text-sm text-cream-50 transition-colors hover:bg-cream-50/10"
        >
          <SiApple size={15} /> Apple
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-cream-50/10" />
        <span className="shrink-0 text-[11px] text-cream-100/40">Hoặc dùng email</span>
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
            className="text-xs text-cream-100/55 transition-colors hover:text-amber-400"
          >
            Quên mật khẩu?
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-clay-500/10 px-3 py-2.5 text-xs text-clay-500 ring-1 ring-clay-500/20">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 py-3.5 text-sm font-semibold text-espresso-950 shadow-lg shadow-amber-500/10 transition-all hover:brightness-105 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-cream-100/60">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-medium text-amber-400 transition-colors hover:text-amber-300">
          Đăng ký ngay
        </Link>
      </p>
    </>
  );
}
