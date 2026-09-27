import { useState } from "react";
import { Check } from "lucide-react";
import EditPopup from "./EditPopup";
import ColorPicker from "../../common/ColorPicker";

const PRESET_COLORS = ["#4A2E1F", "#B8562F", "#0068FF", "#1877F2", "#71886A", "#A5711F", "#2A1810", "#EE4D2D"];
const BUTTON_STYLES = [
  { value: "rounded", label: "Bo tròn" },
  { value: "square", label: "Vuông" },
];

// Theme CHỈ áp dụng cho Landing Page công khai — Admin Dashboard giữ tông nâu cố định.
export default function ThemeEditPopup({ theme, onClose, onSave }) {
  const [primaryColor, setPrimaryColor] = useState(theme?.primaryColor || "#4A2E1F");
  const [buttonStyle, setButtonStyle] = useState(theme?.buttonStyle || "rounded");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ theme: { primaryColor, buttonStyle } });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup
      title="Tùy chỉnh giao diện"
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
      <p className="text-[11px] text-espresso-700/50 mb-4">Chỉ áp dụng cho trang khách hàng nhìn thấy, không ảnh hưởng Admin Dashboard.</p>

      <p className="text-xs text-espresso-700/60 mb-2">Màu gợi ý nhanh</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setPrimaryColor(c)}
            className={`w-9 h-9 rounded-full ring-2 transition-all ${primaryColor === c ? "ring-espresso-900 scale-110" : "ring-transparent"}`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>

      <p className="text-xs text-espresso-700/60 mb-2">Bảng màu chi tiết — kéo để chọn màu chính xác hơn</p>
      <div className="mb-5">
        <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
      </div>

      <p className="text-xs text-espresso-700/60 mb-2">Kiểu nút bấm</p>
      <div className="grid grid-cols-2 gap-2">
        {BUTTON_STYLES.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setButtonStyle(opt.value)}
            className={`flex items-center justify-center gap-2 py-3 border text-sm ${
              opt.value === "rounded" ? "rounded-2xl" : "rounded-md"
            } ${buttonStyle === opt.value ? "border-espresso-800 bg-espresso-800/5 font-medium" : "border-espresso-900/10"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </EditPopup>
  );
}
