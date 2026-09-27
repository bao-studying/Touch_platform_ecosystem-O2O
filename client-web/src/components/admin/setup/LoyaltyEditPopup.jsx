import { useState } from "react";
import { Check } from "lucide-react";
import EditPopup from "./EditPopup";
import PlanLockBadge from "../PlanLockBadge";

export default function LoyaltyEditPopup({ business, hasLoyalty, onClose, onSave }) {
  const [text, setText] = useState(business.loyaltyOfferText || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ loyaltyOfferText: text });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup
      title="Widget Khách hàng thân thiết"
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          disabled={saving || !hasLoyalty}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <Check size={16} /> {saving ? "Đang lưu..." : "Lưu"}
        </button>
      }
    >
      {!hasLoyalty && (
        <div className="rounded-xl bg-amber-400/10 px-3 py-2.5 flex items-center justify-between gap-2 mb-4">
          <p className="text-xs text-espresso-700/70">Widget này chưa hiển thị trên trang khách ở gói Free.</p>
          <PlanLockBadge requiredPlan="level1" />
        </div>
      )}
      <label className="text-xs text-espresso-700/60 mb-1 block">Nội dung nút mời đăng ký</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!hasLoyalty}
        placeholder="VD: Nhận Voucher 10% — Đăng ký thành viên"
        className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm disabled:opacity-50"
      />
    </EditPopup>
  );
}
