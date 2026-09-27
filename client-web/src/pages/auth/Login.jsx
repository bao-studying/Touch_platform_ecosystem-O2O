import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-surface-soft px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 rounded-xl bg-espresso-800 text-cream-50 flex items-center justify-center">
            <Coffee size={20} />
          </span>
          <span className="font-display text-xl text-espresso-950">O2O Brand</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-espresso-900/5 p-6">
          <h1 className="font-display text-xl text-espresso-950 mb-1">Đăng nhập</h1>
          <p className="text-sm text-espresso-700/60 mb-5">Quản lý thương hiệu O2O của bạn</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
            />
            <input
              required
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
            />
            {error && <p className="text-xs text-clay-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-espresso-700/70 mt-4">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-espresso-900 font-medium underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
