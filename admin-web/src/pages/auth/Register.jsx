import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Coffee, User, Mail, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/superadmin/Toast";
import api from "../../api/axios";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import PasswordField from "../../components/auth/PasswordField";

// Đăng ký 2 bước: (1) thông tin tài khoản, (2) chọn gói. Bước 1 dùng đúng bố cục/tông màu của Register ở client-web;
// bước 2 (chọn gói — chỉ có ở admin-web) được vẽ lại theo cùng phong cách kính tối để cả 2 bước liền mạch.
export default function Register() {
  const [step, setStep] = useState(1);
  return (
    <AuthLayout widthClass={step === 2 ? "max-w-md" : "max-w-sm"}>
      <RegisterFlow step={step} setStep={setStep} />
    </AuthLayout>
  );
}

function RegisterFlow({ step, setStep }) {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get("plan") || "free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/public/plans").then((res) => setPlans(res.data)).catch(() => {});
  }, []);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
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

  const comingSoon = (label) => toast.info(label, "Sẽ sớm được hỗ trợ — hiện vui lòng dùng email.");

  const submitClass =
    "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 py-3.5 text-sm font-semibold text-espresso-950 shadow-lg shadow-amber-500/10 transition-all hover:brightness-105 disabled:opacity-60";

  return (
    <>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50/10 text-cream-50 ring-1 ring-cream-50/15">
          <Coffee size={19} />
        </span>
        <span className="font-display text-lg text-cream-50">O2O Brand</span>
      </div>

      {step === 1 ? (
        <>
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-400">BẮT ĐẦU MIỄN PHÍ</p>
          <h1 className="mb-2 font-display text-3xl text-cream-50">Tạo tài khoản</h1>
          <p className="mb-7 text-sm text-cream-100/60">Quảng bá thương hiệu qua NFC/QR chỉ trong vài phút.</p>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => comingSoon("Đăng ký với Google")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-cream-50/15 bg-cream-50/5 py-3 text-sm text-cream-50 transition-colors hover:bg-cream-50/10"
            >
              <SiGoogle size={15} /> Google
            </button>
            <button
              type="button"
              onClick={() => comingSoon("Đăng ký với Apple")}
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

          <form onSubmit={handleStep1Submit} className="space-y-3">
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
              <p className="rounded-lg bg-clay-500/10 px-3 py-2.5 text-xs text-clay-500 ring-1 ring-clay-500/20">{error}</p>
            )}

            <button type="submit" className={submitClass}>
              <ArrowRight size={16} /> Tiếp tục — chọn gói
            </button>

            <p className="pt-1 text-center text-[11px] leading-relaxed text-cream-100/40">
              Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của O2O Brand.
            </p>
          </form>
        </>
      ) : (
        <>
          <button
            onClick={() => setStep(1)}
            className="mb-5 flex items-center gap-1.5 text-sm text-cream-100/60 transition-colors hover:text-amber-400"
          >
            <ArrowLeft size={14} /> Sửa thông tin tài khoản
          </button>
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-400">BƯỚC CUỐI</p>
          <h1 className="mb-2 font-display text-3xl text-cream-50">Chọn gói bắt đầu</h1>
          <p className="mb-6 text-sm text-cream-100/60">Bạn có thể đổi gói bất kỳ lúc nào sau này trong Admin Dashboard.</p>

          <div className="space-y-2.5">
            {plans.map((plan) => {
              const active = selectedPlan === plan.planKey;
              return (
                <button
                  key={plan.planKey}
                  type="button"
                  onClick={() => setSelectedPlan(plan.planKey)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-amber-400/70 bg-amber-400/10"
                      : "border-cream-50/15 bg-cream-50/5 hover:bg-cream-50/10"
                  }`}
                >
                  <div>
                    <div className="font-display font-semibold text-cream-50">{plan.name}</div>
                    <div className="mt-0.5 text-sm text-cream-100/60">
                      {plan.priceVnd === 0 ? "Miễn phí" : plan.priceLabel}
                    </div>
                  </div>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      active ? "border-amber-400 bg-amber-400 text-espresso-950" : "border-cream-50/25 text-transparent"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-clay-500/10 px-3 py-2.5 text-xs text-clay-500 ring-1 ring-clay-500/20">{error}</p>
          )}
          <button onClick={handleFinalSubmit} disabled={loading} className={`${submitClass} mt-6`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {loading ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
          </button>
        </>
      )}

      <p className="mt-7 text-center text-sm text-cream-100/60">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-medium text-amber-400 transition-colors hover:text-amber-300">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
