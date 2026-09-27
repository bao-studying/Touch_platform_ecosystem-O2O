import { useEffect, useState } from "react";
import { Nfc as NfcIcon, Lock, LockOpen, Plus, QrCode as QrCodeIcon, Smartphone } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import NfcActivationModal from "../../components/admin/NfcActivationModal";
import NfcChipDetailPopup from "../../components/admin/NfcChipDetailPopup";
import MascotIllustration from "../../components/common/MascotIllustration";
import { SkeletonList } from "../../components/admin/Skeleton";

export default function Nfc() {
  const { business } = useBusiness();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  const load = () => {
    if (!business) return;
    api
      .get(`/nfc/business/${business._id}`)
      .then((res) => setTags(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [business]);

  const handleClose = () => {
    setModalOpen(false);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-espresso-950">Kích hoạt chip NFC / Mã QR</h1>
          <p className="text-sm text-espresso-700/60">Bấm vào 1 dòng để xem chi tiết, đổi vị trí đặt, hoặc tải lại mã QR.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-espresso-800 text-cream-50 px-3.5 py-2 text-sm font-medium shrink-0">
          <Plus size={16} /> Kích hoạt mới
        </button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-espresso-800 to-espresso-950 text-cream-50 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-cream-50/10 flex items-center justify-center shrink-0">
          <MascotIllustration size={44} />
        </div>
        <div>
          <p className="font-display text-lg">Mô hình linh vật hạt cà phê</p>
          <p className="text-sm text-cream-100/70">Chip NFC/QR đặt kín đáo dưới đế mô hình — khách chạm điện thoại hoặc quét mã để mở trang thương hiệu của bạn.</p>
        </div>
      </div>

      {loading ? (
        <SkeletonList rows={3} />
      ) : tags.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-espresso-900/5 shadow-sm text-center py-10 px-4">
          <MascotIllustration mood="sleep" size={64} className="mx-auto mb-3" />
          <p className="text-sm text-espresso-700/50">Chưa có chip hoặc mã QR nào được kích hoạt.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white ring-1 ring-espresso-900/5 shadow-sm overflow-hidden divide-y divide-espresso-900/5">
          {tags.map((tag) => (
            <button
              key={tag._id}
              onClick={() => setSelectedTag(tag)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream-50 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-espresso-900/5 flex items-center justify-center shrink-0 text-espresso-800">
                {tag.activationMethod === "qr" ? <QrCodeIcon size={16} /> : <Smartphone size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-espresso-900 truncate">{tag.uid} — {tag.itemType}</p>
                <p className="text-xs text-espresso-700/50 truncate">{tag.branch || "Không chia theo chi nhánh"} · {tag.scanCount} lượt quét</p>
              </div>
              {tag.locked ? (
                <span className="inline-flex items-center gap-1 text-[11px] bg-sage-400/15 text-sage-500 px-2 py-1 rounded-full shrink-0">
                  <Lock size={11} /> Đã khóa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-400/15 text-amber-600 px-2 py-1 rounded-full shrink-0">
                  <LockOpen size={11} /> Chưa khóa
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {modalOpen && <NfcActivationModal onClose={handleClose} />}
      {selectedTag && (
        <NfcChipDetailPopup
          tag={selectedTag}
          onClose={() => setSelectedTag(null)}
          onUpdated={(updated) => {
            setSelectedTag(updated);
            setTags((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
          }}
        />
      )}
    </div>
  );
}
