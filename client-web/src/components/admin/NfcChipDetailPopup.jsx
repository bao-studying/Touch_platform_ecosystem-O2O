import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Check, Download, Lock, LockOpen, MapPin, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import EditPopup from "./setup/EditPopup";

export default function NfcChipDetailPopup({ tag, onClose, onUpdated }) {
  const { business } = useBusiness();
  const [placementNote, setPlacementNote] = useState(tag.placementNote || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const qrRef = useRef(null);

  const targetUrl = `${window.location.origin}/p/${business?.slug}?tag=${tag.uid}`;

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/nfc/${tag._id}/note`, { placementNote });
      onUpdated(res.data);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${tag.uid}.png`;
    a.click();
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const res = await api.put(`/nfc/${tag._id}/activate`, { activationMethod: "nfc" });
      onUpdated(res.data);
    } finally {
      setReactivating(false);
    }
  };

  return (
    <EditPopup title={`Chi tiết — ${tag.uid}`} onClose={onClose}>
      <div className="space-y-4">
        {/* QR (nếu kích hoạt bằng QR) — hiện lại ảnh để tải/in lại */}
        {tag.activationMethod === "qr" && (
          <div className="text-center">
            <div ref={qrRef} className="inline-block p-3 bg-white rounded-xl ring-1 ring-espresso-900/10 mb-2">
              <QRCodeCanvas value={targetUrl} size={150} />
            </div>
            <button
              onClick={handleDownloadQr}
              className="mx-auto flex items-center justify-center gap-1.5 rounded-lg bg-espresso-900/5 text-espresso-800 px-3 py-1.5 text-xs font-medium"
            >
              <Download size={13} /> Tải lại ảnh QR
            </button>
          </div>
        )}

        {/* Thông tin chip/QR */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InfoRow label="Loại vật phẩm" value={tag.itemType} />
          <InfoRow label="Chi nhánh" value={tag.branch || "—"} />
          <InfoRow label="Ngày tạo" value={new Date(tag.createdAt).toLocaleDateString("vi-VN")} />
          <InfoRow label="Ngày kích hoạt" value={tag.activatedAt ? new Date(tag.activatedAt).toLocaleDateString("vi-VN") : "—"} />
          <InfoRow label="Tổng lượt quét" value={tag.scanCount} />
          <InfoRow
            label="Trạng thái"
            value={
              <span className={`inline-flex items-center gap-1 ${tag.locked ? "text-sage-500" : "text-amber-600"}`}>
                {tag.locked ? <Lock size={11} /> : <LockOpen size={11} />} {tag.locked ? "Đã khóa" : "Chưa khóa"}
              </span>
            }
          />
        </div>

        {/* URL đích */}
        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block">URL đích</label>
          <div className="flex items-center gap-2 bg-espresso-900/5 rounded-lg px-3 py-2">
            <p className="text-xs text-espresso-700/70 truncate flex-1">{targetUrl}</p>
            <button onClick={handleCopyUrl} className="shrink-0 text-espresso-800">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Vị trí đặt — ghi chú tự do */}
        <div>
          <label className="text-xs text-espresso-700/60 mb-1 flex items-center gap-1">
            <MapPin size={12} /> Vị trí đặt (ghi chú riêng)
          </label>
          <div className="flex gap-2">
            <input
              value={placementNote}
              onChange={(e) => setPlacementNote(e.target.value)}
              placeholder="VD: Quầy thu ngân, đầu bàn số 3..."
              className="flex-1 rounded-lg border border-espresso-900/15 px-3 py-2 text-sm"
            />
            <button onClick={handleSaveNote} disabled={saving} className="rounded-lg bg-espresso-800 text-cream-50 px-3 text-sm disabled:opacity-60">
              Lưu
            </button>
          </div>
        </div>

        {/* Kích hoạt lại — chỉ có ý nghĩa với chip NFC thật (phòng khi chip hỏng cần ghi lại) */}
        {tag.activationMethod === "nfc" && (
          <button
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-espresso-900/15 text-espresso-800 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            <RefreshCw size={14} /> {reactivating ? "Đang cập nhật..." : "Đánh dấu đã ghi lại chip"}
          </button>
        )}
      </div>
    </EditPopup>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-espresso-700/40">{label}</p>
      <p className="text-espresso-900 font-medium">{value}</p>
    </div>
  );
}
