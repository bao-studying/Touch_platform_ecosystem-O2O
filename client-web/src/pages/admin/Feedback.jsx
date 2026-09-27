import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle2, Star, MessageSquareHeart } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { SkeletonList } from "../../components/admin/Skeleton";

const STATUS_LABEL = { new: "Mới", seen: "Đã xem", resolved: "Đã xử lý" };
const STATUS_STYLE = {
  new: "bg-clay-500/10 text-clay-500",
  seen: "bg-amber-400/15 text-amber-600",
  resolved: "bg-sage-400/15 text-sage-500",
};

// Trang "Góp ý" — liệt kê TOÀN BỘ góp ý nội bộ của khách (cả từ luồng 1-3 sao lẫn nút
// "Gửi góp ý riêng" không chấm sao trên Landing Page). Mở từ ô card trên Home.
export default function Feedback() {
  const { business } = useBusiness();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | new | seen | resolved

  const loadData = async () => {
    if (!business) return;
    const res = await api.get(`/reviews/business/${business._id}`, { params: { channel: "internal" } });
    setReviews(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (query && !(r.feedbackText || "").toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [reviews, statusFilter, query]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return reviews.filter((r) => new Date(r.createdAt).toDateString() === today).length;
  }, [reviews]);

  const handleResolve = async (id) => {
    try {
      await api.put(`/reviews/${id}/status`, { status: "resolved" });
      showToast("Đã đánh dấu xử lý xong", "success");
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Không cập nhật được, thử lại nhé.", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8">
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8 space-y-4">
      <div>
        <h1 className="font-display text-2xl text-espresso-950 flex items-center gap-2">
          <MessageSquareHeart size={22} className="text-espresso-800" /> Góp ý khách hàng
        </h1>
        <p className="text-sm text-espresso-700/60">
          {reviews.length} góp ý tổng cộng · {todayCount} góp ý hôm nay
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-700/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo nội dung góp ý..."
            className="w-full rounded-xl border border-espresso-900/15 pl-9 pr-3 py-2.5 text-sm bg-white"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {["all", "new", "seen", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-medium ${
                statusFilter === s ? "bg-espresso-800 text-cream-50" : "bg-white text-espresso-700/60 ring-1 ring-espresso-900/10"
              }`}
            >
              {s === "all" ? "Tất cả" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((r) => (
          <div key={r._id} className="rounded-2xl bg-white ring-1 ring-espresso-900/5 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {r.rating > 0 ? (
                    <p className="text-amber-500 text-sm leading-none">
                      {"★".repeat(r.rating)}
                      <span className="text-espresso-900/15">{"★".repeat(5 - r.rating)}</span>
                    </p>
                  ) : (
                    <span className="text-[10px] text-espresso-700/40 flex items-center gap-1">
                      <Star size={11} /> Không chấm sao (góp ý riêng)
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  {r.branch && <span className="text-[10px] text-espresso-700/40">· {r.branch}</span>}
                </div>
                <p className="text-sm text-espresso-900">{r.feedbackText || "(không có nội dung)"}</p>
                <p className="text-[11px] text-espresso-700/40 mt-1">{new Date(r.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              {r.status !== "resolved" && (
                <button
                  onClick={() => handleResolve(r._id)}
                  className="shrink-0 flex items-center gap-1 text-sage-500 text-xs font-medium bg-sage-400/10 rounded-lg px-2.5 py-1.5"
                  aria-label="Đánh dấu đã xử lý"
                >
                  <CheckCircle2 size={14} /> Xử lý xong
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-14">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-espresso-900/5 flex items-center justify-center">
              <MessageSquareHeart size={24} className="text-espresso-700/30" />
            </div>
            <p className="text-sm text-espresso-700/60">
              {reviews.length === 0 ? "Chưa có góp ý nào từ khách hàng." : "Không có góp ý nào khớp bộ lọc hiện tại."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
