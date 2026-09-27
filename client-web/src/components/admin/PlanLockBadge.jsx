import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { PLAN_LABELS } from "../../utils/planLimits";

// Badge nhỏ "🔒 Cần Level X" — bấm vào nhảy thẳng sang Store thay vì chỉ làm mờ im lặng.
export default function PlanLockBadge({ requiredPlan, label }) {
  return (
    <Link
      to="/admin/store"
      className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-400/15 text-amber-700 rounded-full px-2 py-1 hover:bg-amber-400/25"
    >
      <Lock size={10} /> {label || `Cần ${PLAN_LABELS[requiredPlan]}`}
    </Link>
  );
}
