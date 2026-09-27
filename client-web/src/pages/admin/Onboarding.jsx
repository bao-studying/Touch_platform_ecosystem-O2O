import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refreshBusiness } = useBusiness();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/business", { name });
      await refreshBusiness();
      navigate("/admin/setup");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo doanh nghiệp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-surface-soft px-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm ring-1 ring-espresso-900/5 p-6 text-center">
        <span className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center mb-4">
          <Store size={26} />
        </span>
        <h1 className="font-display text-xl text-espresso-950 mb-1">Tạo hồ sơ doanh nghiệp</h1>
        <p className="text-sm text-espresso-700/60 mb-5">
          Đây sẽ là tên hiển thị trên Landing Page khi khách chạm/quét NFC.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            autoFocus
            placeholder="VD: Cafe Gấu Nâu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
          />
          {error && <p className="text-xs text-clay-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Đang tạo..." : "Bắt đầu"}
          </button>
        </form>
      </div>
    </div>
  );
}
