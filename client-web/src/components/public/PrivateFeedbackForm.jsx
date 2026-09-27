import { useState } from "react";
import { MessageSquareHeart, X, Send, CheckCircle2, Star } from "lucide-react";
import api from "../../api/axios";
import useDismissablePopup from "../../hooks/useDismissablePopup";

// "Góp ý riêng": khách có thể chủ động gửi góp ý thẳng cho chủ quán bất cứ lúc nào,
// không cần đi qua luồng chấm sao của Smart Review. Luôn lưu ở kênh nội bộ (internal),
// hiển thị trong trang "Góp ý" của Admin — không public, không ảnh hưởng review Google/Shopee.
export default function PrivateFeedbackForm({ businessId, theme, promptText }) {
  const radiusClass = theme?.buttonStyle === "square" ? "rounded-md" : "rounded-xl";
  const pillRadiusClass = theme?.buttonStyle === "square" ? "rounded-md" : "rounded-full";
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const { closing, requestClose, backdropProps } = useDismissablePopup(() => setOpen(false));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reviews/public/private", { businessId, feedbackText: text.trim(), rating });
      setDone(true);
    } catch (err) {
      setError("Không gửi được góp ý, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpen = () => {
    setDone(false);
    setText("");
    setRating(0);
    setError("");
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="mx-auto flex items-center justify-center gap-1.5 text-xs text-espresso-700/60 py-1"
      >
        <MessageSquareHeart size={14} />
        {promptText || "Gửi góp ý riêng cho chúng tôi"}
      </button>

      {open && (
        <div
          {...backdropProps}
          className={`fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-espresso-950/40 backdrop-blur-sm p-4 ${
            closing ? "animate-fade-out" : "animate-fade-in"
          }`}
        >
          <div className={`w-full max-w-sm rounded-2xl glass-panel p-5 shadow-xl relative ${closing ? "animate-pop-out" : "animate-pop-in"}`}>
            <button onClick={requestClose} className="absolute top-3 right-3 text-espresso-700/50" aria-label="Đóng">
              <X size={20} />
            </button>

            {!done ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquareHeart className={pillRadiusClass === "rounded-full" ? "text-espresso-800" : "text-espresso-800"} size={20} />
                  <h3 className="font-display text-lg text-espresso-900">Góp ý riêng</h3>
                </div>
                <p className="text-xs text-espresso-700/70 mb-4">
                  Góp ý của bạn chỉ gửi riêng cho chủ quán, không đăng công khai — chúng tôi trân trọng mọi chia sẻ.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRating(rating === v ? 0 : v)}
                        className="p-0.5"
                        aria-label={`${v} sao`}
                      >
                        <Star size={22} className={rating >= v ? "fill-amber-500 text-amber-500" : "fill-transparent text-espresso-900/20"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Điều gì chúng tôi có thể làm tốt hơn? (không bắt buộc chấm sao)"
                    className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
                  />
                  {error && <p className="text-xs text-clay-500 text-center">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: "var(--brand, #4A2E1F)" }}
                    className={`w-full flex items-center justify-center gap-2 ${radiusClass} text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60`}
                  >
                    <Send size={16} /> {submitting ? "Đang gửi..." : "Gửi góp ý"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="mx-auto mb-2 text-sage-500" size={32} />
                <p className="font-medium text-espresso-900">Đã gửi góp ý!</p>
                <p className="text-xs text-espresso-700/70 mt-1">Cảm ơn bạn đã dành thời gian chia sẻ.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
