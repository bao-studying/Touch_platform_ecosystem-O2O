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

// Đăng nhập thường — dùng cho cả tài khoản KHÁCH (chủ doanh nghiệp mua hàng) lẫn tài khoản Super Admin (chủ nền tảng).
// Thử đăng nhập khách trước; nếu sai email/mật khẩu, thử tiếp với tài khoản Super Admin trước khi báo lỗi.
//   • Super Admin  → /super-admin/dashboard (Dashboard chỉ dành cho Super Admin).
//   • Khách        → /account (cài đặt tài khoản: hồ sơ, địa chỉ, giỏ hàng, đơn hàng) hoặc trang họ đang định quay lại (?redirect=).
// Giao diện dùng chung với client-web (AuthLayout + AuthField + PasswordField + AuthSidePanel).
export default function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

// Chỉ nhận đường dẫn nội bộ (chống open-redirect kiểu ?redirect=//evil.com) và không cho khách bị đẩy vào khu Super Admin.
const safeRedirect = (raw) => {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/super-admin") || raw === "/login" || raw === "/register") return null;
  return raw;
};

function LoginForm() {
  const { admin, login, logout: logoutCustomer } = useAuth();
  const { superAdmin, login: loginSuperAdmin, logout: logoutSuperAdmin } = useSuperAdminAuth();
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
      logoutSuperAdmin(); // đăng nhập khách xong thì bỏ phiên Super Admin cũ (nếu có) để 2 vai trò không lẫn nhau
      navigate(safeRedirect(searchParams.get("redirect")) || "/account", { replace: true });
      return;
    } catch (err) {
      // Sai email/mật khẩu ở phía khách → thử lại với tài khoản Super Admin trước khi báo lỗi.
      if (err.response?.status === 401) {
        try {
          await loginSuperAdmin(form.email, form.password);
          logoutCustomer(); // bỏ phiên khách cũ (nếu có)
          navigate("/super-admin/dashboard", { replace: true });
          return;
        } catch (saErr) {
          // Super Admin API chỉ cho thử tối đa vài lần / 15 phút — nói rõ thay vì báo "sai mật khẩu" khó hiểu.
          if (saErr.response?.status === 429) {
            setError(saErr.response.data?.message || "Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút");
            return;
          }
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

      {(admin || superAdmin) && (
        <div className="mb-6 rounded-2xl bg-cream-50/[0.06] px-4 py-3 text-xs text-cream-100/80 ring-1 ring-cream-50/10">
          Bạn đang đăng nhập với tên <strong className="text-cream-50">{admin ? admin.name : superAdmin.name}</strong>.{" "}
          <Link to={admin ? "/account" : "/super-admin/dashboard"} className="font-medium text-amber-400 underline underline-offset-2">
            {admin ? "Vào tài khoản" : "Vào Dashboard"}
          </Link>
          {" · "}
          <button type="button" onClick={admin ? logoutCustomer : logoutSuperAdmin} className="font-medium text-amber-400 underline underline-offset-2">
            Đăng xuất
          </button>
          <span className="block pt-1 text-cream-100/50">Đăng nhập bên dưới sẽ chuyển sang tài khoản khác.</span>
        </div>
      )}

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
