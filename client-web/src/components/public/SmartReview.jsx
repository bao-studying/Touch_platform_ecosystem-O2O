import { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";

// Luồng: 4-5 sao -> gọi API rồi điều hướng ra link công khai (Google Maps/Shopee, hoặc thẳng khung
//        "Viết đánh giá" nếu đã cấu hình Google Place ID). 1-3 sao -> hiện form góp ý nội bộ.
// Với gói chưa mở Smart Review, backend luôn trả redirectUrl bất kể mấy sao (form đơn giản hơn).
export default function SmartReview({ businessId, theme }) {
  const radiusClass = theme?.buttonStyle === "square" ? "rounded-md" : "rounded-xl";
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSelectStar = async (value) => {
    setRating(value);
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/reviews/public", { businessId, rating: value });
      if (res.data.redirectUrl) {
        // 4-5 sao: gửi bản ghi rồi mở link đánh giá công khai
        window.location.href = res.data.redirectUrl;
      } else {
        // 1-3 sao: mở form góp ý nội bộ
        setShowFeedbackForm(true);
      }
    } catch (err) {
      setError("Không thể gửi đánh giá, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reviews/public", { businessId, rating, feedbackText });
      setDone(true);
    } catch (err) {
      setError("Không thể gửi góp ý, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-sage-400/10 border border-sage-400/30 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 text-sage-500" size={28} />
        <p className="text-sm text-espresso-800 font-medium">Cảm ơn góp ý của bạn!</p>
        <p className="text-xs text-espresso-700/70 mt-1">Chúng tôi sẽ cải thiện trải nghiệm phục vụ tốt hơn.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm ring-1 ring-espresso-900/5">
      <p className="text-center font-display text-lg text-espresso-900 mb-1">
        Bạn hài lòng với dịch vụ hôm nay chứ?
      </p>
      <p className="text-center text-xs text-espresso-700/60 mb-4">Chạm vào số sao để đánh giá</p>

      <div className="flex justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={submitting}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleSelectStar(value)}
            className="p-1 disabled:opacity-50"
            aria-label={`${value} sao`}
          >
            <Star
              size={34}
              className={
                (hovered || rating) >= value
                  ? "fill-amber-500 text-amber-500 transition-colors"
                  : "fill-transparent text-espresso-900/20 transition-colors"
              }
            />
          </button>
        ))}
      </div>

      {error && <p className="text-center text-xs text-clay-500 mt-2">{error}</p>}

      {showFeedbackForm && !done && (
        <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-3">
          <p className="text-xs text-espresso-700/70 text-center">
            Rất tiếc vì trải nghiệm chưa tốt, hãy góp ý trực tiếp với Quản lý nhé.
          </p>
          <textarea
            required
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={3}
            placeholder="Điều gì khiến bạn chưa hài lòng?"
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-800/30"
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: "var(--brand, #4A2E1F)" }}
            className={`w-full flex items-center justify-center gap-2 ${radiusClass} text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60`}
          >
            <Send size={16} /> {submitting ? "Đang gửi..." : "Gửi góp ý"}
          </button>
        </form>
      )}
    </div>
  );
}
