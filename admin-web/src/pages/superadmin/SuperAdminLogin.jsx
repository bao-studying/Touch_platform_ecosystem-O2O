import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext";

// Trang này KHÔNG được link ở bất kỳ đâu trên giao diện công khai — chỉ truy cập được nếu biết thẳng URL.
// Đường vào chính thức cho tài khoản Super Admin giờ là trang /login (đăng nhập thường, tự nhận diện);
// trang này chỉ còn là lối vào trực tiếp dự phòng.
export default function SuperAdminLogin() {
  const { login } = useSuperAdminAuth();
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
      navigate("/super-admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-5">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>

        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
            <ShieldCheck size={20} />
          </span>
          <span className="font-body text-xl font-semibold text-white">Super Admin</span>
        </div>

        <div className="bg-white/5 rounded-2xl ring-1 ring-white/5 p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Đăng nhập quản trị nền tảng</h1>
          <p className="text-sm text-slate-400 mb-5">Khu vực nội bộ — không dành cho tài khoản doanh nghiệp</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              type="email"
              placeholder="Email quản trị"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              required
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-400 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
