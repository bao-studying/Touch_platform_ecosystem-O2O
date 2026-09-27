import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Coffee, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1); // 1 = thông tin tài khoản, 2 = chọn gói
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get("plan") || "free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/public/plans").then((res) => setPlans(res.data)).catch(() => {});
  }, []);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, selectedPlan);
      navigate("/download");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
      setStep(1); // quay lại bước nhập thông tin nếu lỗi (vd email đã tồn tại)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-5 py-10">
      <div className={`w-full ${step === 2 ? "max-w-2xl" : "max-w-sm"}`}>
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 rounded-xl bg-espresso-800 text-cream-50 flex items-center justify-center">
            <Coffee size={20} />
          </span>
          <span className="font-display text-xl text-espresso-950">O2O Brand</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-espresso-900/5 p-6">
          {step === 1 ? (
            <>
              <h1 className="font-display text-xl text-espresso-950 mb-1">Tạo tài khoản</h1>
              <p className="text-sm text-espresso-700/60 mb-5">Bắt đầu quảng bá thương hiệu của bạn qua NFC/QR</p>

              <form onSubmit={handleStep1Submit} className="space-y-3">
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
                  className="w-full rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium"
                >
                  Tiếp tục — chọn gói
                </button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-espresso-600 mb-3">
                <ArrowLeft size={14} /> Quay lại
              </button>
              <h1 className="font-display text-xl text-espresso-950 mb-1">Chọn gói bắt đầu</h1>
              <p className="text-sm text-espresso-700/60 mb-5">Bạn có thể đổi gói bất kỳ lúc nào sau này trong Admin Dashboard.</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.planKey}
                    type="button"
                    onClick={() => setSelectedPlan(plan.planKey)}
                    className={`text-left rounded-xl border-2 p-4 transition-colors ${
                      selectedPlan === plan.planKey ? "border-espresso-800 bg-cream-50" : "border-espresso-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-espresso-950">{plan.name}</span>
                      {selectedPlan === plan.planKey && <Check size={16} className="text-espresso-800" />}
                    </div>
                    <div className="text-sm text-espresso-700 mt-1">
                      {plan.priceVnd === 0 ? "Miễn phí" : plan.priceLabel}
                    </div>
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-clay-500 mt-3">{error}</p>}
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="w-full mt-5 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {loading ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
              </button>
            </>
          )}
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
