import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
          <h1 className="font-display text-xl text-espresso-950 mb-1">Tạo tài khoản</h1>
          <p className="text-sm text-espresso-700/60 mb-5">Bắt đầu quảng bá thương hiệu của bạn qua NFC/QR</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="Họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
            />
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
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              minLength={6}
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
              {loading ? "Đang tạo..." : "Đăng ký"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-espresso-700/70 mt-4">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-espresso-900 font-medium underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
