import { useState } from "react";
import { Check } from "lucide-react";
import EditPopup from "./EditPopup";
import PlanLockBadge from "../PlanLockBadge";
import { getPlanLimits } from "../../../utils/planLimits";

const FONT_OPTIONS = [
  { value: "fraunces", label: "Cổ điển ấm áp", sample: "Fraunces", style: { fontFamily: "'Fraunces', serif" } },
  { value: "poppins", label: "Hiện đại tối giản", sample: "Poppins", style: { fontFamily: "'Poppins', sans-serif" } },
  { value: "quicksand", label: "Thân thiện bo tròn", sample: "Quicksand", style: { fontFamily: "'Quicksand', sans-serif" } },
];

export default function BioEditPopup({ name, bio, theme, plan, onClose, onSave }) {
  const [draftName, setDraftName] = useState(name || "");
  const [draftBio, setDraftBio] = useState(bio || "");
  const [fontFamily, setFontFamily] = useState(theme?.fontFamily || "fraunces");
  const [saving, setSaving] = useState(false);
  const hasFontPicker = getPlanLimits(plan).hasFontPicker;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name: draftName, bio: draftBio, theme: { fontFamily } });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPopup
      title="Tên & Giới thiệu"
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
        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block">Tên doanh nghiệp</label>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-espresso-700/60 mb-1 block">Lời chào / Bio</label>
          <textarea
            rows={4}
            maxLength={300}
            value={draftBio}
            onChange={(e) => setDraftBio(e.target.value)}
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2.5 text-sm"
          />
          <p className="text-[11px] text-espresso-700/40 mt-1 text-right">{draftBio.length}/300</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-espresso-700/60">Kiểu chữ thương hiệu</label>
            {!hasFontPicker && <PlanLockBadge requiredPlan="level1" />}
          </div>
          <div className="space-y-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!hasFontPicker}
                onClick={() => setFontFamily(opt.value)}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left disabled:opacity-40 ${
                  fontFamily === opt.value ? "border-espresso-800 bg-espresso-800/5" : "border-espresso-900/10"
                }`}
              >
                <span className="text-[11px] text-espresso-700/60">{opt.label}</span>
                <span style={opt.style} className="text-lg text-espresso-900">
                  {opt.sample}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </EditPopup>
  );
}
