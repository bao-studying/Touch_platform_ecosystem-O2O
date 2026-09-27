import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import EditPopup from "./EditPopup";
import PlanLockBadge from "../PlanLockBadge";

export default function ReviewSettingsEditPopup({ business, hasSmartReview, onClose, onSave }) {
  const [googleMapsLink, setGoogleMapsLink] = useState(business.googleMapsLink || "");
  const [googlePlaceId, setGooglePlaceId] = useState(business.googlePlaceId || "");
  const [shopeeLink, setShopeeLink] = useState(business.shopeeLink || "");
  const [reviewThreshold, setReviewThreshold] = useState(business.reviewThreshold || 4);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ googleMapsLink, googlePlaceId, shopeeLink, reviewThreshold: Number(reviewThreshold) });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup
      title="Đánh giá thông minh"
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <Check size={16} /> {saving ? "Đang lưu..." : "Lưu"}
        </button>
      }
    >
      <div className="space-y-4">
        {!hasSmartReview && (
          <div className="rounded-xl bg-amber-400/10 px-3 py-2.5 flex items-center justify-between gap-2">
            <p className="text-xs text-espresso-700/70">
              Gói hiện tại hiển thị đánh giá dạng đơn giản (mọi mức sao đều đi thẳng ra Google Maps).
            </p>
            <PlanLockBadge requiredPlan="level2" label="Mở Smart Review" />
          </div>
        )}

        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block">Link đánh giá Google Maps</label>
          <input
            value={googleMapsLink}
            onChange={(e) => setGoogleMapsLink(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block flex items-center justify-between">
            Google Place ID{" "}
            <a
              href="https://developers.google.com/maps/documentation/places/web-service/place-id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-espresso-700/50 underline inline-flex items-center gap-0.5"
            >
              Tra cứu <ExternalLink size={9} />
            </a>
          </label>
          <input
            value={googlePlaceId}
            onChange={(e) => setGooglePlaceId(e.target.value)}
            placeholder="VD: ChIJN1t_tDeuEmsRUsoyG83frY4"
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
          />
          <p className="text-[11px] text-espresso-700/45 mt-1">
            Có Place ID → khách bấm 4-5⭐ vào thẳng khung "Viết đánh giá". Chưa có → dùng link Maps phía trên.
          </p>
        </div>

        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block">Link đánh giá Shopee (dự phòng)</label>
          <input
            value={shopeeLink}
            onChange={(e) => setShopeeLink(e.target.value)}
            placeholder="https://shopee.vn/..."
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block">Ngưỡng sao redirect công khai (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={reviewThreshold}
            onChange={(e) => setReviewThreshold(e.target.value)}
            disabled={!hasSmartReview}
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm disabled:opacity-50"
          />
        </div>
      </div>
    </EditPopup>
  );
}
