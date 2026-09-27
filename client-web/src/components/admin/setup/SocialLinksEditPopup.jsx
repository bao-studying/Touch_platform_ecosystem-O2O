import { useState } from "react";
import { SiFacebook, SiTiktok, SiShopee, SiZalo, SiInstagram, SiYoutube, SiGmail } from "react-icons/si";
import { Wifi, Phone, Globe, Trash2, Plus, Check, ChevronDown } from "lucide-react";
import api from "../../../api/axios";
import EditPopup from "./EditPopup";
import AnimationPicker from "../AnimationPicker";
import PlanLockBadge from "../PlanLockBadge";
import { getPlanLimits } from "../../../utils/planLimits";
import { detectPlatform } from "../../../utils/detectPlatform";
import { useToast } from "../../../context/ToastContext";

const PLATFORM_ICON = {
  facebook: SiFacebook,
  tiktok: SiTiktok,
  shopee: SiShopee,
  zalo: SiZalo,
  website: Globe,
  wifi: Wifi,
  hotline: Phone,
  instagram: SiInstagram,
  youtube: SiYoutube,
  email: SiGmail,
};
const PLATFORM_LABEL = {
  facebook: "Facebook",
  tiktok: "TikTok",
  shopee: "Shopee",
  zalo: "Zalo",
  website: "Website",
  wifi: "Wifi quán",
  hotline: "Hotline",
  instagram: "Instagram",
  youtube: "YouTube",
  email: "Email",
};

function LinkRow({ link, plan, onSaved, onDeleted }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(link.url);
  const [label, setLabel] = useState(link.label || "");
  const [animation, setAnimation] = useState(link.animation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const Icon = PLATFORM_ICON[detectPlatform(url)] || Globe;
  const allowedAnimations = getPlanLimits(plan).allowedAnimations;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const platform = detectPlatform(url);
      const res = await api.put(`/links/${link._id}`, { url, label, animation, platform });
      onSaved(res.data);
      setOpen(false);
      showToast("Đã lưu liên kết", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Không lưu được, thử lại nhé.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/links/${link._id}`);
      onDeleted(link._id);
      showToast("Đã xóa liên kết", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Không xóa được, thử lại nhé.", "error");
    }
  };

  return (
    <div className="rounded-xl border border-espresso-900/10 bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
        <span className="w-9 h-9 rounded-full bg-espresso-900/5 flex items-center justify-center shrink-0">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-espresso-900 truncate">{link.label || PLATFORM_LABEL[link.platform]}</p>
          <p className="text-xs text-espresso-700/50 truncate">{link.url}</p>
        </div>
        <ChevronDown size={16} className={`text-espresso-700/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-espresso-900/8 pt-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Dán URL — hệ thống tự nhận diện nền tảng"
            className="w-full rounded-lg border border-espresso-900/15 px-2.5 py-1.5 text-sm"
          />
          <p className="text-[11px] text-espresso-700/50">
            Nhận diện: <span className="font-medium text-espresso-800">{PLATFORM_LABEL[detectPlatform(url)]}</span>
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nhãn hiển thị tùy chỉnh (tùy chọn)"
            className="w-full rounded-lg border border-espresso-900/15 px-2.5 py-1.5 text-sm"
          />
          <AnimationPicker
            value={animation}
            onChange={setAnimation}
            allowedAnimations={allowedAnimations}
            onLockedClick={() => setError("Hiệu ứng này cần nâng cấp lên Level 2.")}
          />
          {error && <p className="text-xs text-clay-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-espresso-800 text-cream-50 py-2 text-sm font-medium disabled:opacity-60"
            >
              <Check size={14} /> {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button onClick={handleDelete} className="rounded-lg bg-clay-500/10 text-clay-500 px-3">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialLinksEditPopup({ businessId, plan, links, onClose, onRefresh }) {
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newAnimation, setNewAnimation] = useState("stationary");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const limits = getPlanLimits(plan);
  const atLimit = links.length >= limits.maxSocialLinks;

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const platform = detectPlatform(newUrl);
      await api.post("/links", { business: businessId, url: newUrl, label: newLabel, animation: newAnimation, platform, order: links.length });
      setNewUrl("");
      setNewLabel("");
      setNewAnimation("stationary");
      setAdding(false);
      onRefresh();
      showToast("Đã thêm liên kết mới", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Không thêm được liên kết, thử lại nhé.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup title="Cổng liên kết nền tảng" onClose={onClose}>
      <div className="space-y-2.5">
        {links.map((link) => (
          <LinkRow
            key={link._id}
            link={link}
            plan={plan}
            onSaved={onRefresh}
            onDeleted={onRefresh}
          />
        ))}

        {links.length === 0 && <p className="text-center text-sm text-espresso-700/50 py-4">Chưa có liên kết nào.</p>}

        {atLimit ? (
          <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-400/5 px-3 py-3 flex items-center justify-between gap-2">
            <p className="text-xs text-espresso-700/70">
              Đã dùng {links.length}/{limits.maxSocialLinks} liên kết của gói hiện tại.
            </p>
            <PlanLockBadge requiredPlan="level1" label="Nâng cấp" />
          </div>
        ) : !adding ? (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-espresso-900/25 text-espresso-700/70 py-2.5 text-sm"
          >
            <Plus size={16} /> Thêm liên kết
          </button>
        ) : (
          <form onSubmit={handleAdd} className="rounded-xl border border-espresso-900/10 bg-white p-3 space-y-2">
            <input
              autoFocus
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Dán URL — vd: https://facebook.com/..."
              className="w-full rounded-lg border border-espresso-900/15 px-2.5 py-1.5 text-sm"
            />
            {newUrl && (
              <p className="text-[11px] text-espresso-700/50">
                Nhận diện: <span className="font-medium text-espresso-800">{PLATFORM_LABEL[detectPlatform(newUrl)]}</span>
              </p>
            )}
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nhãn hiển thị tùy chỉnh (tùy chọn)"
              className="w-full rounded-lg border border-espresso-900/15 px-2.5 py-1.5 text-sm"
            />
            <AnimationPicker
              value={newAnimation}
              onChange={setNewAnimation}
              allowedAnimations={limits.allowedAnimations}
              onLockedClick={() => setError("Hiệu ứng này cần nâng cấp lên Level 2.")}
            />
            {error && <p className="text-xs text-clay-500">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-espresso-800 text-cream-50 py-2 text-sm font-medium disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="flex-1 rounded-lg bg-espresso-900/10 text-espresso-700 py-2 text-sm">
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </EditPopup>
  );
}
