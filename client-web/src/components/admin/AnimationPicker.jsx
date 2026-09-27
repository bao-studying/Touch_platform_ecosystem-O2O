import { Lock } from "lucide-react";

const OPTIONS = [
  { value: "stationary", label: "Mặc định", hint: "Icon đứng yên" },
  { value: "bouncing", label: "Nảy nhẹ", hint: "Bouncing" },
  { value: "marquee", label: "Chạy ngang", hint: "Marquee liên tục" },
  { value: "orbit", label: "Orbit", hint: "Xoay quanh Avatar" },
];

const PreviewIcon = ({ value }) => (
  <div className="w-9 h-9 rounded-full bg-espresso-900/5 flex items-center justify-center overflow-hidden shrink-0">
    <span
      className={
        value === "marquee"
          ? "animate-marquee inline-block"
          : value === "orbit"
          ? "animate-orbit inline-block"
          : value === "bouncing"
          ? "animate-bounce-soft inline-block"
          : "inline-block"
      }
      style={value === "orbit" ? { "--orbit-radius": "8px" } : undefined}
    >
      🔗
    </span>
  </div>
);

// allowedAnimations: mảng animation được phép theo gói hiện tại (từ utils/planLimits.js).
// Lựa chọn ngoài danh sách này hiện khóa mờ + badge "🔒", bấm vào gọi onLockedClick thay vì chọn.
export default function AnimationPicker({ value, onChange, allowedAnimations, onLockedClick }) {
  return (
    <div>
      <p className="text-xs text-espresso-700/60 mb-2">Hiệu ứng (Animations)</p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const locked = allowedAnimations && !allowedAnimations.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => (locked ? onLockedClick?.() : onChange(opt.value))}
              className={`relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                locked
                  ? "border-espresso-900/8 opacity-50"
                  : value === opt.value
                  ? "border-espresso-800 bg-espresso-800/5"
                  : "border-espresso-900/10 hover:border-espresso-900/20"
              }`}
            >
              <PreviewIcon value={opt.value} />
              <span>
                <span className="block text-xs font-medium text-espresso-900">{opt.label}</span>
                <span className="block text-[10px] text-espresso-700/50">{opt.hint}</span>
              </span>
              {locked && (
                <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] bg-amber-400/20 text-amber-700 rounded-full px-1.5 py-0.5">
                  <Lock size={8} /> Level 2
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
