import { useState } from "react";
import { Check } from "lucide-react";
import EditPopup from "./EditPopup";

// Popup cấu hình khối "Góp ý riêng" — nút cho khách gửi thẳng góp ý tới chủ quán, không qua chấm
// sao. Cho phép admin bật/tắt hiển thị trên Landing Page + đổi nhãn nút cho hợp giọng thương hiệu.
export default function FeedbackEditPopup({ business, onClose, onSave }) {
  const [enabled, setEnabled] = useState(business.privateFeedbackEnabled !== false);
  const [promptText, setPromptText] = useState(business.feedbackPromptText || "Gửi góp ý riêng cho chúng tôi");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ privateFeedbackEnabled: enabled, feedbackPromptText: promptText.trim() || "Gửi góp ý riêng cho chúng tôi" });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup
      title="Góp ý riêng"
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
      <p className="text-[11px] text-espresso-700/50 mb-4">
        Khách bấm vào nút này để gửi thẳng góp ý riêng cho bạn — không đăng công khai, không qua luồng chấm sao.
        Xem tất cả góp ý ở mục "Góp ý khách hàng" trong menu.
      </p>

      <button
        onClick={() => setEnabled((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl bg-espresso-900/5 px-3 py-3 mb-4"
      >
        <span className="text-sm font-medium text-espresso-900">Hiển thị trên trang khách</span>
        <span
          className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-espresso-800" : "bg-espresso-900/20"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      <label className="text-xs text-espresso-700/60 mb-1 block">Nhãn nút hiển thị</label>
      <input
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        disabled={!enabled}
        maxLength={100}
        placeholder="Gửi góp ý riêng cho chúng tôi"
        className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm disabled:opacity-50"
      />
    </EditPopup>
  );
}
