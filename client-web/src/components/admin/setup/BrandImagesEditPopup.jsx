import { useState } from "react";
import { Upload, Check, Loader2 } from "lucide-react";
import EditPopup from "./EditPopup";
import { uploadImageFile } from "../../../api/upload";

function ImageSlot({ label, value, onChange, shape }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const frameClass = shape === "wide" ? "w-full h-32 rounded-xl" : "w-24 h-24 rounded-2xl";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } catch {
      setError("Tải ảnh lên thất bại, thử lại nhé.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-espresso-700/60 mb-1.5">{label}</p>
      <div className={`${shape === "wide" ? "" : "flex items-center gap-3"}`}>
        {/* Khung xem trước CỐ ĐỊNH kích thước, không phụ thuộc link dài ngắn hay ảnh gốc to nhỏ */}
        <div className={`${frameClass} bg-espresso-900/5 overflow-hidden ring-1 ring-espresso-900/10 flex items-center justify-center relative shrink-0`}>
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <span className="text-espresso-900/25 text-[10px]">Chưa có</span>}
          {uploading && (
            <div className="absolute inset-0 bg-espresso-950/40 flex items-center justify-center">
              <Loader2 className="animate-spin text-cream-50" size={18} />
            </div>
          )}
        </div>
        <div className={shape === "wide" ? "mt-2 flex gap-2" : "flex-1 space-y-1.5"}>
          <label className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-espresso-900/25 text-espresso-700/70 py-2 text-xs cursor-pointer flex-1">
            <Upload size={13} /> Tải ảnh lên
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hoặc dán link ảnh"
            className="w-full rounded-lg border border-espresso-900/15 px-2 py-1.5 text-xs truncate"
          />
        </div>
      </div>
      {error && <p className="text-[11px] text-clay-500 mt-1">{error}</p>}
    </div>
  );
}

export default function BrandImagesEditPopup({ business, onClose, onSave }) {
  const [coverUrl, setCoverUrl] = useState(business.coverUrl || "");
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || "");
  const [mascotUrl, setMascotUrl] = useState(business.mascotUrl || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ coverUrl, logoUrl, mascotUrl });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup
      title="Ảnh thương hiệu"
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
      <div className="space-y-5">
        <ImageSlot label="Ảnh bìa (Cover)" value={coverUrl} onChange={setCoverUrl} shape="wide" />
        <ImageSlot label="Logo / Avatar" value={logoUrl} onChange={setLogoUrl} shape="square" />
        <div>
          <ImageSlot label="Linh vật (Mascot)" value={mascotUrl} onChange={setMascotUrl} shape="square" />
          <p className="text-[11px] text-espresso-700/45 mt-1.5">Hiện ở giữa khi có Social Link dùng hiệu ứng Orbit.</p>
        </div>
      </div>
    </EditPopup>
  );
}
