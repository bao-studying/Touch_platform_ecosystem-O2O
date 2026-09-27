import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Wifi, ChevronRight, AlertTriangle, QrCode, Smartphone, Download } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import MascotIllustration from "../common/MascotIllustration";
import useDismissablePopup from "../../hooks/useDismissablePopup";

const ITEM_TYPES = ["Gấu bông", "Mô hình 3D", "Thẻ gỗ/Acrylic decor", "Sticker để bàn"];

// Quy trình: 1) Chọn loại vật phẩm -> 2) Nhập UID -> 3) Chọn chi nhánh -> 4) Chạm để kích hoạt (NFC) HOẶC Tạo mã QR.
// Mã QR hữu ích khi demo/chưa có chip vật lý — vẫn gắn cùng 1 UID nên lượt quét vẫn được đếm như chip thật.
// Web NFC API (NDEFReader) chỉ chạy trên Chrome for Android qua HTTPS + cần thao tác chạm thật của người dùng.
export default function NfcActivationModal({ onClose }) {
  const { business } = useBusiness();
  const [step, setStep] = useState(1);
  const [itemType, setItemType] = useState(ITEM_TYPES[0]);
  const [uid, setUid] = useState("");
  const [branch, setBranch] = useState(business?.branches?.[0] || "");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [nfcUnsupported, setNfcUnsupported] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const qrRef = useRef(null);

  const targetUrl = `${window.location.origin}/p/${business?.slug}?tag=${uid}`;

  const registerTag = async () => {
    const res = await api.post("/nfc", { business: business._id, uid, itemType, branch });
    return res.data;
  };

  const handleActivateNfc = async () => {
    setError("");
    try {
      const created = await registerTag();
      setScanning(true);

      if ("NDEFReader" in window) {
        try {
          const ndef = new window.NDEFReader();
          await ndef.write({ records: [{ recordType: "url", data: targetUrl }] });
        } catch (nfcErr) {
          setScanning(false);
          setError("Không ghi được vào chip: " + (nfcErr.message || "vui lòng chạm điện thoại vào chip và thử lại."));
          return;
        }
      } else {
        setNfcUnsupported(true);
      }

      await api.put(`/nfc/${created._id}/activate`, { activationMethod: "nfc" });
      setScanning(false);
      setSuccess(true);
    } catch (err) {
      setScanning(false);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi kích hoạt chip");
    }
  };

  const handleGenerateQr = async () => {
    setError("");
    try {
      const created = await registerTag();
      await api.put(`/nfc/${created._id}/activate`, { activationMethod: "qr" });
      setQrMode(true);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tạo mã QR");
    }
  };

  const handleDownloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${uid || business.slug}.png`;
    a.click();
  };

  // Không cho bấm ra ngoài để đóng khi đang chạm chip (tránh hủy nhầm thao tác NFC giữa chừng)
  const { closing, requestClose, backdropProps } = useDismissablePopup(onClose, { disabled: scanning });

  return (
    <div
      {...backdropProps}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 ${
        closing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div className={`w-full max-w-sm rounded-2xl glass-panel p-5 shadow-xl relative ${closing ? "animate-pop-out" : "animate-pop-in"}`}>
        <button onClick={requestClose} className="absolute top-3 right-3 text-espresso-700/50" aria-label="Đóng">
          <X size={20} />
        </button>

        {!scanning && !success && (
          <>
            <h3 className="font-display text-lg text-espresso-950 mb-4">Kích hoạt chip NFC / Tạo mã QR</h3>

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-xs text-espresso-700/60">Loại vật phẩm decor</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-1 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium"
                >
                  Tiếp tục <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="text-xs text-espresso-700/60">Mã UID của chip (in trên bao bì chip, hoặc tự đặt nếu demo QR)</label>
                <input
                  required
                  value={uid}
                  onChange={(e) => setUid(e.target.value.trim())}
                  placeholder="VD: GB-0001"
                  className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
                />
                <button
                  disabled={!uid}
                  onClick={() => setStep(3)}
                  className="w-full flex items-center justify-center gap-1 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  Tiếp tục <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="text-xs text-espresso-700/60">Chi nhánh áp dụng</label>
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="VD: Chi nhánh Quận 1 (để trống nếu chỉ có 1 địa điểm)"
                  className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
                />
                <div className="rounded-xl bg-espresso-900/5 px-3 py-2 text-xs text-espresso-700/70 break-all">
                  URL sẽ gắn với chip/QR: <span className="font-medium">{targetUrl}</span>
                </div>
                {error && (
                  <p className="text-xs text-clay-500 flex items-center gap-1">
                    <AlertTriangle size={14} /> {error}
                  </p>
                )}
                <button
                  onClick={handleActivateNfc}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium"
                >
                  <Smartphone size={16} /> Chạm để kích hoạt (NFC)
                </button>
                <button
                  onClick={handleGenerateQr}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-espresso-900/15 text-espresso-800 py-2.5 text-sm font-medium"
                >
                  <QrCode size={16} /> Tạo mã QR (chưa có chip / demo)
                </button>
              </div>
            )}
          </>
        )}

        {scanning && (
          <div className="py-8 text-center">
            <div className="relative mx-auto w-28 h-28 mb-4">
              <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
              <div className="absolute inset-3 rounded-full bg-sky-400/30 animate-ping [animation-delay:200ms]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
                  <MascotIllustration size={40} />
                </span>
              </div>
              <Wifi className="absolute -top-1 -right-1 text-sky-500" size={22} />
            </div>
            <p className="text-sm font-medium text-espresso-900">Đưa điện thoại lại gần chip NFC...</p>
            <p className="text-xs text-espresso-700/60 mt-1">Giữ nguyên trong giây lát</p>
          </div>
        )}

        {success && !qrMode && (
          <div className="py-6 text-center">
            <MascotIllustration mood="wave" size={64} className="mx-auto mb-2" />
            <p className="font-medium text-espresso-900">Kích hoạt thành công!</p>
            <p className="text-xs text-espresso-700/70 mt-1">Chip đã được khóa, chống ghi đè URL độc hại.</p>
            {nfcUnsupported && (
              <p className="text-xs text-amber-600 mt-3 bg-amber-400/10 rounded-lg px-3 py-2">
                Thiết bị/trình duyệt này chưa hỗ trợ Web NFC (chỉ hỗ trợ Chrome for Android). Bản ghi đã được
                lưu trên hệ thống ở chế độ demo — hãy kích hoạt lại bằng điện thoại Android khi ra sản phẩm thật.
              </p>
            )}
            <button onClick={requestClose} className="mt-4 w-full rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium">
              Xong
            </button>
          </div>
        )}

        {success && qrMode && (
          <div className="py-4 text-center">
            <p className="font-medium text-espresso-900 mb-3">Mã QR đã sẵn sàng</p>
            <div ref={qrRef} className="inline-block p-3 bg-white rounded-xl ring-1 ring-espresso-900/10 mb-3">
              <QRCodeCanvas value={targetUrl} size={180} />
            </div>
            <p className="text-xs text-espresso-700/60 mb-4">Quét thử bằng điện thoại để kiểm tra, hoặc tải ảnh về in dán tạm ở quán.</p>
            <button
              onClick={handleDownloadQr}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium mb-2"
            >
              <Download size={16} /> Tải ảnh QR
            </button>
            <button onClick={requestClose} className="w-full rounded-xl bg-espresso-900/10 text-espresso-700 py-2.5 text-sm font-medium">
              Xong
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
