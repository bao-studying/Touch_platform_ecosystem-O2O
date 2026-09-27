import { useState } from "react";
import { Eye, X } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { getPlanLimits } from "../../utils/planLimits";
import useDismissablePopup from "../../hooks/useDismissablePopup";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import LandingPage from "../public/LandingPage";
import BrandImagesEditPopup from "../../components/admin/setup/BrandImagesEditPopup";
import BioEditPopup from "../../components/admin/setup/BioEditPopup";
import SocialLinksEditPopup from "../../components/admin/setup/SocialLinksEditPopup";
import ReviewSettingsEditPopup from "../../components/admin/setup/ReviewSettingsEditPopup";
import LoyaltyEditPopup from "../../components/admin/setup/LoyaltyEditPopup";
import ThemeEditPopup from "../../components/admin/setup/ThemeEditPopup";
import FeedbackEditPopup from "../../components/admin/setup/FeedbackEditPopup";

// Setup Tab kiểu Facebook: chỉnh sửa TRỰC TIẾP trên bản xem thật (giống hệt trang công khai),
// mỗi khối có 1 nút "✎ Edit" nổi ngay trên đó — bấm vào mở popup chỉnh riêng phần ấy.
// Dùng chung cho cả mobile lẫn desktop (không còn split-screen).
export default function Setup() {
  const { business, links, refreshLinks, updateBusinessLocal } = useBusiness();
  const { showToast } = useToast();
  const [activePopup, setActivePopup] = useState(null); // 'images' | 'bio' | 'links' | 'review' | 'loyalty' | 'theme'
  const [guestPreview, setGuestPreview] = useState(false);
  // duration khớp với animate-slide-out-up (220ms) để không unmount sớm hơn lúc hiệu ứng trượt
  // xuống thật sự chạy xong.
  const { closing: previewClosing, requestClose: closePreview, backdropProps: previewBackdropProps } = useDismissablePopup(
    () => setGuestPreview(false),
    { disabled: !guestPreview, duration: 220 }
  );
  // Khoá cuộn trang Setup phía sau trong lúc bottom sheet xem trước đang mở trên mobile.
  useLockBodyScroll(guestPreview);

  if (!business) return null;

  const limits = getPlanLimits(business.plan);

  // Điểm lưu DÙNG CHUNG cho mọi popup Setup Tab — báo rõ thành công/thất bại bằng toast thay vì
  // chỉ lặng lẽ đóng popup, để người dùng luôn chắc chắn thay đổi đã được lưu.
  const saveField = async (patch) => {
    try {
      const res = await api.put(`/business/${business._id}`, patch);
      updateBusinessLocal(res.data);
      showToast("Đã lưu thay đổi", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Không lưu được, vui lòng thử lại", "error");
      throw err; // để popup gọi biết lưu thất bại, không đóng lại (giữ dữ liệu người dùng đang nhập)
    }
  };

  const previewBusiness = {
    ...business,
    links,
    loyaltyOfferText: business.loyaltyOfferText,
    features: {
      hasLoyalty: limits.hasLoyalty,
      hasSmartReview: limits.hasSmartReview,
      showsAds: limits.showsAds,
    },
  };

  const editHandlers = {
    onEditBrandImages: () => setActivePopup("images"),
    onEditBio: () => setActivePopup("bio"),
    onEditLinks: () => setActivePopup("links"),
    onEditReview: () => setActivePopup("review"),
    onEditLoyalty: () => setActivePopup("loyalty"),
    onEditTheme: () => setActivePopup("theme"),
    onEditFeedback: () => setActivePopup("feedback"),
  };

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-20 flex items-center justify-between bg-cream-100/90 backdrop-blur px-4 py-3 md:px-8">
        <div>
          <h1 className="font-display text-lg text-espresso-950">Setup Tab</h1>
          <p className="text-xs text-espresso-700/60">Bấm vào từng phần để chỉnh sửa trực tiếp</p>
        </div>
        <button
          onClick={() => setGuestPreview(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 text-white px-3.5 py-2 text-sm font-medium shadow-sm shrink-0"
        >
          <Eye size={16} /> Xem như khách
        </button>
      </div>

      {/* Khung điện thoại căn giữa trên desktop cho gọn mắt, full-width trên mobile */}
      <div className="md:flex md:justify-center md:pt-4">
        <div className="md:w-[380px] md:rounded-[2rem] md:border-[6px] md:border-espresso-950 md:overflow-hidden md:shadow-xl md:max-h-[calc(100vh-140px)] md:overflow-y-auto">
          <LandingPage previewData={previewBusiness} editHandlers={editHandlers} />
        </div>
      </div>

      {activePopup === "images" && (
        <BrandImagesEditPopup business={business} onClose={() => setActivePopup(null)} onSave={(patch) => saveField(patch)} />
      )}
      {activePopup === "bio" && (
        <BioEditPopup
          name={business.name}
          bio={business.bio}
          theme={business.theme}
          plan={business.plan}
          onClose={() => setActivePopup(null)}
          onSave={(patch) => saveField(patch)}
        />
      )}
      {activePopup === "links" && (
        <SocialLinksEditPopup businessId={business._id} plan={business.plan} links={links} onClose={() => setActivePopup(null)} onRefresh={refreshLinks} />
      )}
      {activePopup === "review" && (
        <ReviewSettingsEditPopup business={business} hasSmartReview={limits.hasSmartReview} onClose={() => setActivePopup(null)} onSave={(patch) => saveField(patch)} />
      )}
      {activePopup === "loyalty" && (
        <LoyaltyEditPopup business={business} hasLoyalty={limits.hasLoyalty} onClose={() => setActivePopup(null)} onSave={(patch) => saveField(patch)} />
      )}
      {activePopup === "theme" && (
        <ThemeEditPopup theme={business.theme} onClose={() => setActivePopup(null)} onSave={(patch) => saveField(patch)} />
      )}
      {activePopup === "feedback" && (
        <FeedbackEditPopup business={business} onClose={() => setActivePopup(null)} onSave={(patch) => saveField(patch)} />
      )}

      {/* Chế độ xem phía khách — full màn hình để đảm bảo LUÔN hiện đủ toàn bộ nội dung, cuộn được
          hết xuống dưới cùng (trước đây dùng bottom-sheet chỉ chiếm 2/3 màn hình nên dễ bị cảm giác
          "cắt mất" phần dưới). Vẫn giữ hiệu ứng trượt lên mượt + nút đóng nổi góc trên. */}
      {guestPreview && (
        <div
          {...previewBackdropProps}
          className={`fixed inset-0 z-50 bg-cream-50 ${previewClosing ? "animate-fade-out" : "animate-fade-in"}`}
        >
          <div
            className={`h-full w-full overflow-y-auto ${previewClosing ? "animate-slide-out-up" : "animate-slide-in-up"}`}
          >
            <div className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur pt-2.5 pb-2.5 px-4 flex items-center justify-between border-b border-espresso-900/8">
              <span className="font-display text-base text-espresso-950">Xem như khách</span>
              <button
                onClick={closePreview}
                className="w-8 h-8 rounded-full bg-espresso-900/8 text-espresso-800 flex items-center justify-center"
                aria-label="Đóng xem trước"
              >
                <X size={16} />
              </button>
            </div>
            <LandingPage previewData={previewBusiness} />
          </div>
        </div>
      )}
    </div>
  );
}
