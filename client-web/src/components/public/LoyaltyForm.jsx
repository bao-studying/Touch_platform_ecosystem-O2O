import { useState } from "react";
import { Gift, X, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import useDismissablePopup from "../../hooks/useDismissablePopup";

// Widget góc màn hình mời đăng ký Khách hàng thân thiết. Không chắn tầm nhìn, có thể đóng lại.
export default function LoyaltyForm({ businessId, offerText, theme }) {
  const radiusClass = theme?.buttonStyle === "square" ? "rounded-md" : "rounded-xl";
  const pillRadiusClass = theme?.buttonStyle === "square" ? "rounded-md" : "rounded-full";
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", dob: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/leads/public", { businessId, ...form });
      setDone(true);
    } catch (err) {
      // giữ form mở để khách thử lại
    } finally {
      setSubmitting(false);
    }
  };

  const { closing, requestClose, backdropProps } = useDismissablePopup(() => (done ? setDismissed(true) : setOpen(false)));

  if (dismissed) return null;

  return (
    <>
      {/* Thẻ ưu đãi mỏng góc màn hình */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ backgroundColor: "var(--brand, #4A2E1F)" }}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 ${pillRadiusClass} text-cream-50 pl-3 pr-4 py-2.5 shadow-lg shadow-espresso-900/20 text-sm`}
        >
          <Gift size={18} className="text-amber-400" />
          {offerText || "Nhận Voucher 10% — Đăng ký thành viên"}
        </button>
      )}

      {open && (
        <div
          {...backdropProps}
          className={`fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-espresso-950/40 backdrop-blur-sm p-4 ${
            closing ? "animate-fade-out" : "animate-fade-in"
          }`}
        >
          <div className={`w-full max-w-sm rounded-2xl glass-panel p-5 shadow-xl relative ${closing ? "animate-pop-out" : "animate-pop-in"}`}>
            <button
              onClick={requestClose}
              className="absolute top-3 right-3 text-espresso-700/50"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            {!done ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="text-amber-500" size={22} />
                  <h3 className="font-display text-lg text-espresso-900">Khách hàng thân thiết</h3>
                </div>
                <p className="text-xs text-espresso-700/70 mb-4">{offerText || "Nhận ngay ưu đãi và tích điểm cho lần ghé sau."}</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Họ và tên"
                    className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
                  />
                  <input
                    required
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại"
                    inputMode="tel"
                    className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
                  />
                  <div>
                    <label className="text-xs text-espresso-700/60 mb-1 block">Ngày sinh (để tặng quà sinh nhật)</label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: "var(--brand, #4A2E1F)" }}
                    className={`w-full ${radiusClass} text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60`}
                  >
                    {submitting ? "Đang gửi..." : "Đăng ký ngay"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="mx-auto mb-2 text-sage-500" size={32} />
                <p className="font-medium text-espresso-900">Đăng ký thành công!</p>
                <p className="text-xs text-espresso-700/70 mt-1">Hẹn gặp lại bạn ở lần ghé tiếp theo 🎁</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
