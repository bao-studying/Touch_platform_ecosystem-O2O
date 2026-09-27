import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Palette, ImagePlus } from "lucide-react";
import api from "../../api/axios";
import SmartReview from "../../components/public/SmartReview";
import SocialLinks from "../../components/public/SocialLinks";
import LoyaltyForm from "../../components/public/LoyaltyForm";
import PrivateFeedbackForm from "../../components/public/PrivateFeedbackForm";
import EditBadge from "../../components/admin/setup/EditBadge";
import MascotIllustration from "../../components/common/MascotIllustration";

const FONT_MAP = {
  fraunces: "'Fraunces', serif",
  poppins: "'Poppins', sans-serif",
  quicksand: "'Quicksand', sans-serif",
};

// Landing Page công khai: /p/:slug?tag=UID
// Cũng được Setup Tab tái dùng ở "editMode" (kiểu Facebook — Edit nổi ngay trên từng khối của trang thật).
// previewData: dữ liệu business+links (dùng khi render trong Setup, không tự gọi API).
// editHandlers: { onEditBrandImages, onEditBio, onEditLinks, onEditReview, onEditLoyalty, onEditTheme }
export default function LandingPage({ previewData = null, editHandlers = null }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [business, setBusiness] = useState(previewData);
  const [loading, setLoading] = useState(!previewData);
  const [error, setError] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const editMode = !!editHandlers;

  useEffect(() => {
    if (previewData) {
      setBusiness(previewData);
      return;
    }
    const fetchBusiness = async () => {
      try {
        const res = await api.get(`/business/public/${slug}`);
        setBusiness(res.data);
        const tag = searchParams.get("tag");
        if (tag) api.post(`/nfc/scan/${tag}`).catch(() => {});
      } catch (err) {
        setError("Không tìm thấy trang này. Vui lòng kiểm tra lại đường liên kết.");
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, previewData]);

  useEffect(() => {
    if (previewData) return; // trong khung preview nhỏ, không theo dõi scroll của cả trang
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [previewData]);

  const scrollProgress = Math.min(scrollY / 160, 1);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream-50 text-espresso-700">Đang tải...</div>;
  }
  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 text-espresso-700 px-6 text-center">
        {error || "Không có dữ liệu"}
      </div>
    );
  }

  const theme = business.theme || { primaryColor: "#4A2E1F", buttonStyle: "rounded", fontFamily: "fraunces" };
  const brandFont = FONT_MAP[theme.fontFamily] || FONT_MAP.fraunces;
  const features = business.features || { hasLoyalty: true, hasSmartReview: true, showsAds: false };

  return (
    <div className={previewData ? "relative" : "relative min-h-screen"} style={{ "--brand": theme.primaryColor }}>
      {/* HERO: ảnh bìa + avatar. Trên trang công khai dùng "fixed" (dính theo cả viewport, nội
          dung cuộn lên đè lên trên). Trong bản xem trước (Setup Tab / "Xem như khách") không thể
          dùng "fixed" vì sẽ thoát ra khỏi khung xem trước đang cuộn riêng — dùng "sticky" để vẫn
          dính lại đúng bên trong khung cuộn của nó, khối nội dung bên dưới vẫn đè lên y hệt. */}
      <div
        className={`${previewData ? "sticky top-0 h-56" : "fixed top-0 h-[38vh]"} left-0 right-0 overflow-hidden bg-espresso-800`}
      >
        {/* Ảnh nền "chìm" nhẹ xuống dưới + phóng to nhẹ khi cuộn lên — cùng lúc với việc mờ dần ở overlay bên dưới,
            tạo cảm giác khối thông tin đè lên và ảnh nền lùi ra sau (hiệu ứng parallax sink). */}
        <div
          className="absolute inset-0"
          style={previewData ? {} : { transform: `translateY(${scrollProgress * 28}px) scale(${1 + scrollProgress * 0.12})` }}
        >
          {business.coverUrl ? (
            <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-espresso-700 to-espresso-950" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-espresso-950/10 via-espresso-950/5 to-cream-50/95" />
        <div
          className="absolute inset-0 bg-espresso-950 transition-opacity"
          style={{ opacity: previewData && !editMode ? 0 : editMode ? 0.25 : scrollProgress * 0.55 }}
        />

        <div
          className="absolute top-5 left-5 flex items-center gap-3 transition-all"
          style={previewData ? {} : { opacity: 1 - scrollProgress, transform: `translateY(${-scrollProgress * 16}px)` }}
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-cream-50/80 shadow-md bg-cream-100 flex items-center justify-center">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <MascotIllustration size={34} />
            )}
          </div>
          <span style={{ fontFamily: brandFont }} className="text-cream-50 text-lg drop-shadow-sm">
            {business.name}
          </span>
        </div>

        {editMode && (
          <>
            <EditBadge onClick={editHandlers.onEditBrandImages} className="absolute top-4 right-4" label="Ảnh thương hiệu" />
            <button
              onClick={editHandlers.onEditTheme}
              className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-espresso-950/80 backdrop-blur text-cream-50 flex items-center justify-center shadow-md"
              aria-label="Tùy chỉnh giao diện"
            >
              <Palette size={14} />
            </button>
          </>
        )}
      </div>

      {/* Spacer đẩy nội dung xuống dưới hero lúc ban đầu — chỉ cần cho trang công khai (hero
          "fixed" không chiếm chỗ trong layout). Ở bản xem trước, hero "sticky" đã tự chiếm đúng
          chiều cao của nó rồi nên không cần thêm spacer (xem margin âm ở khối nội dung bên dưới). */}
      {!previewData && <div className="h-[30vh]" />}

      {/* Khối nội dung tràn lên phía trên khi cuộn. Ở bản xem trước dùng margin âm để kéo khối
          này đè lên phần dưới của hero ngay từ đầu (tương đương khoảng hở spacer cũ 160px =
          224px hero - 64px đè lên), rồi tiếp tục đè dần lên hero "sticky" khi cuộn xuống — y hệt
          hiệu ứng trên trang công khai. */}
      <div
        className={`relative z-10 rounded-t-[28px] bg-cream-50 px-5 pt-6 shadow-[0_-12px_30px_rgba(42,24,16,0.12)] ${
          previewData ? "-mt-16 pb-10" : "min-h-screen pb-32"
        }`}
      >
        {/* Thanh kéo — luôn hiển thị, nhuốm màu thương hiệu nhẹ để thấy ngay khi đổi Theme */}
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full" style={{ backgroundColor: "var(--brand)", opacity: 0.25 }} />

        <div className="relative">
          {editMode && <EditBadge onClick={editHandlers.onEditBio} className="absolute -top-1 right-0" label="Bio" />}
          <h1 style={{ fontFamily: brandFont }} className="text-2xl text-espresso-950 text-center mb-1">
            {business.name}
          </h1>
          {business.bio && <p className="text-center text-sm text-espresso-700/70 mb-6 leading-relaxed">{business.bio}</p>}
        </div>

        <div className="space-y-6">
          <div className="relative">
            {editMode && <EditBadge onClick={editHandlers.onEditReview} className="absolute -top-2 right-0 z-10" label="Smart Review" />}
            <SmartReview businessId={business._id} theme={theme} />
          </div>

          <div className="relative">
            {editMode && <EditBadge onClick={editHandlers.onEditLinks} className="absolute -top-2 right-0 z-10" label="Social Links" />}
            <SocialLinks links={business.links} mascotUrl={business.mascotUrl} />
          </div>

          <div className="relative">
            {editMode && <EditBadge onClick={editHandlers.onEditFeedback} className="absolute -top-2 right-0 z-10" label="Góp ý riêng" />}
            {business.privateFeedbackEnabled !== false ? (
              <PrivateFeedbackForm businessId={business._id} theme={theme} promptText={business.feedbackPromptText} />
            ) : (
              editMode && <p className="text-center text-[11px] text-espresso-700/40 py-2">Đang tắt — khách sẽ không thấy nút này.</p>
            )}
          </div>

          {editMode && (
            // Trong Setup Tab: thẻ preview tĩnh cho widget Loyalty (widget thật là 1 nút nổi toàn màn hình, không hợp để nhúng inline lúc edit)
            <div className="relative rounded-2xl bg-white ring-1 ring-espresso-900/5 p-3 flex items-center gap-3 shadow-sm">
              <EditBadge onClick={editHandlers.onEditLoyalty} className="absolute -top-2 right-2 z-10" label="Membership Widget" />
              <div
                className="w-10 h-10 rounded-full overflow-hidden bg-cream-100 shrink-0 flex items-center justify-center ring-2"
                style={{ "--tw-ring-color": "var(--brand)" }}
              >
                {business.logoUrl ? <img src={business.logoUrl} className="w-full h-full object-cover" alt="" /> : <MascotIllustration size={26} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-espresso-900 truncate">{business.loyaltyOfferText}</p>
                <p className="text-[10px] text-espresso-700/50">{features.hasLoyalty ? "Đang hiển thị trên trang khách" : "🔒 Cần Level 1 để hiển thị"}</p>
              </div>
            </div>
          )}

          {features.showsAds && (
            <div className="rounded-xl border border-dashed border-espresso-900/15 py-3 text-center">
              <p className="text-[11px] text-espresso-700/35">Vị trí quảng cáo — gói Free & Level 1</p>
            </div>
          )}
        </div>
      </div>

      {!previewData && features.hasLoyalty && (
        <LoyaltyForm businessId={business._id} offerText={business.loyaltyOfferText} theme={theme} />
      )}
    </div>
  );
}
