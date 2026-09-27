import { useEffect } from "react";
import { PartyPopper } from "lucide-react";

export default function UnlockToast({ features, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!features || features.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-espresso-950 text-cream-50 shadow-xl px-4 py-3.5">
      <p className="flex items-center gap-2 text-sm font-medium mb-1.5">
        <PartyPopper size={16} className="text-amber-400" /> Đã mở khóa
      </p>
      <ul className="text-xs text-cream-100/80 space-y-0.5">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
    </div>
  );
}
