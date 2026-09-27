import { useEffect, useState } from "react";
import { Check, X, Package, Wrench, AlertTriangle, RotateCcw } from "lucide-react";
import api from "../../api/axios";
import adminServerApi from "../../lib/adminServerAxios";
import { adminServerSocket } from "../../lib/socket";
import { useBusiness } from "../../context/BusinessContext";
import { diffUnlockedFeatures } from "../../utils/planLimits";
import UnlockToast from "../../components/admin/UnlockToast";
import PaymentModal from "../../components/admin/PaymentModal";
import { SkeletonBlock } from "../../components/admin/Skeleton";

const COMPARE_ROWS = [
  { label: "Số Social Links", free: "2", level1: "Không giới hạn", level2: "Không giới hạn", level3: "Không giới hạn" },
  { label: "Hiệu ứng Marquee/Orbit", free: false, level1: false, level2: true, level3: true },
  { label: "Loyalty Lead Capture", free: false, level1: true, level2: true, level3: true },
  { label: "CRM + Xuất CSV", free: false, level1: true, level2: true, level3: true },
  { label: "Smart Review (gating)", free: false, level1: false, level2: true, level3: true },
  { label: "Chọn kiểu chữ thương hiệu", free: false, level1: true, level2: true, level3: true },
  { label: "Đa chi nhánh", free: false, level1: false, level2: false, level3: true },
  { label: "Không có quảng cáo", free: false, level1: false, level2: true, level3: true },
];

// Định dạng số tiền VNĐ gọn — dùng cho giá sản phẩm hardware (Admin Server chỉ trả về priceVnd dạng số).
const formatVnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

export default function Store() {
  const { business, updateBusinessLocal, refreshBusiness } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(null);
  const [payingPlan, setPayingPlan] = useState(null); // plan id đang mở PaymentModal, null = đóng

  // Giá gói & sản phẩm hardware giờ lấy TRỰC TIẾP từ Admin Server (Super Admin quản lý ở Billing &
  // Plans / Hardware) — không còn viết chết trong code. `plansError`/`hardwareError` bật lên khi
  // không gọi được Admin Server (ví dụ đang tắt lúc phát triển), để không hiện bảng giá trống trơn
  // mà không rõ lý do.
  const [plans, setPlans] = useState(null); // null = đang tải, [] = tải xong nhưng rỗng
  const [plansError, setPlansError] = useState(false);
  const [hardware, setHardware] = useState(null);
  const [hardwareError, setHardwareError] = useState(false);

  const loadPlans = () => {
    setPlansError(false);
    adminServerApi
      .get("/public/plans")
      .then((res) => setPlans(res.data))
      .catch(() => setPlansError(true));
  };

  const loadHardware = () => {
    setHardwareError(false);
    adminServerApi
      .get("/public/hardware")
      .then((res) => setHardware(res.data))
      .catch(() => setHardwareError(true));
  };

  useEffect(() => {
    loadPlans();
    loadHardware();
    // Super Admin đổi giá/sản phẩm trong lúc tenant đang mở trang Store → tự cập nhật ngay,
    // không cần tải lại trang.
    adminServerSocket.on("plan:updated", loadPlans);
    adminServerSocket.on("hardware:updated", loadHardware);
    return () => {
      adminServerSocket.off("plan:updated", loadPlans);
      adminServerSocket.off("hardware:updated", loadHardware);
    };
  }, []);

  const handleSelectPlan = async (planKey) => {
    if (planKey === "free") {
      setSaving(true);
      try {
        const res = await api.put(`/business/${business._id}/plan`, { plan: "free" });
        updateBusinessLocal(res.data.business);
      } finally {
        setSaving(false);
      }
      return;
    }
    setPayingPlan(planKey);
  };

  const handlePaymentSuccess = async (planKey) => {
    const oldPlan = business.plan;
    setPayingPlan(null);
    const updated = await refreshBusiness();
    const features = diffUnlockedFeatures(oldPlan, updated?.plan || planKey);
    if (features.length > 0) setUnlocked(features);
  };

  const activeHardware = (hardware || []).filter((h) => h.isActive !== false);
  const cheapestHardware = activeHardware.length
    ? activeHardware.reduce((min, h) => (h.priceVnd < min.priceVnd ? h : min))
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-espresso-950">Gói dịch vụ</h1>
        <p className="text-sm text-espresso-700/60">Nâng cấp để mở khóa Smart Review, CRM và quản lý đa chi nhánh.</p>
      </div>

      {plansError && (
        <div className="rounded-2xl bg-clay-500/10 ring-1 ring-clay-500/20 p-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-clay-500">
            <AlertTriangle size={16} className="shrink-0" /> Không tải được bảng giá — vui lòng thử lại.
          </p>
          <button onClick={loadPlans} className="shrink-0 flex items-center gap-1 text-xs font-medium text-clay-500 bg-white rounded-lg px-2.5 py-1.5">
            <RotateCcw size={13} /> Thử lại
          </button>
        </div>
      )}

      {plans === null && !plansError ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(plans || []).map((plan) => {
            const active = business?.plan === plan.planKey;
            const priceDisplay = plan.priceVnd === 0 ? "0đ" : plan.priceLabel || formatVnd(plan.priceVnd);
            return (
              <div
                key={plan.planKey}
                className={`rounded-2xl p-5 flex flex-col shadow-sm ring-1 ${
                  active ? "bg-espresso-950 text-cream-50 ring-espresso-950" : "bg-white ring-espresso-900/5"
                }`}
              >
                <p className="font-display text-lg">{plan.name}</p>
                <p className={`text-xl font-semibold mt-1 ${active ? "text-amber-400" : "text-espresso-900"}`}>{priceDisplay}</p>
                <p className={`text-xs mt-2 ${active ? "text-cream-100/70" : "text-espresso-700/60"}`}>{plan.tagline}</p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {(plan.features || []).map((f) => (
                    <li key={f} className={`flex items-start gap-1.5 text-xs ${active ? "text-cream-100/85" : "text-espresso-700/75"}`}>
                      <Check size={13} className={`mt-0.5 shrink-0 ${active ? "text-amber-400" : "text-sage-500"}`} /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={active || saving}
                  onClick={() => handleSelectPlan(plan.planKey)}
                  className={`mt-4 rounded-xl py-2 text-sm font-medium ${
                    active ? "bg-cream-50/10 text-cream-50 cursor-default" : "bg-espresso-800 text-cream-50"
                  }`}
                >
                  {active ? "Đang sử dụng" : plan.planKey === "free" ? "Chọn gói này" : "Nâng cấp — Thanh toán"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bảng so sánh tính năng — ma trận GIỚI HẠN tính năng vẫn cố định theo logic backend
          (config/planLimits.js), không đổi theo giá nên vẫn để tĩnh ở đây. */}
      <div className="rounded-2xl bg-white ring-1 ring-espresso-900/5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-espresso-900/8">
              <th className="text-left px-4 py-3 text-espresso-700/60 font-medium text-xs">Tính năng</th>
              {["free", "level1", "level2", "level3"].map((planKey) => (
                <th key={planKey} className="text-center px-4 py-3 text-espresso-900 font-medium text-xs">
                  {plans?.find((p) => p.planKey === planKey)?.name || planKey}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-espresso-900/5 last:border-0">
                <td className="px-4 py-2.5 text-espresso-800 text-xs">{row.label}</td>
                {["free", "level1", "level2", "level3"].map((planId) => (
                  <td key={planId} className="text-center px-4 py-2.5">
                    {typeof row[planId] === "boolean" ? (
                      row[planId] ? (
                        <Check size={15} className="mx-auto text-sage-500" />
                      ) : (
                        <X size={15} className="mx-auto text-espresso-900/20" />
                      )
                    ) : (
                      <span className="text-xs text-espresso-700/80">{row[planId]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white ring-1 ring-espresso-900/5 p-5 shadow-sm">
          <Package className="text-clay-500 mb-2" size={22} />
          <p className="font-medium text-espresso-900 mb-1">Bán kèm phần cứng</p>
          <p className="text-xs text-espresso-700/60 mb-3">Mô hình decor gắn sẵn chip NFC (NTAG213) + mã QR, đã lập trình sẵn để chạm là mở trang.</p>

          {hardwareError ? (
            <button onClick={loadHardware} className="flex items-center gap-1 text-xs font-medium text-clay-500">
              <RotateCcw size={13} /> Không tải được, bấm để thử lại
            </button>
          ) : hardware === null ? (
            <SkeletonBlock className="h-5 w-32 rounded" />
          ) : activeHardware.length === 0 ? (
            <p className="text-sm text-espresso-700/50">Hiện chưa có sản phẩm nào.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-espresso-900">Từ {formatVnd(cheapestHardware.priceVnd)} / vật phẩm</p>
              <ul className="mt-2 space-y-1">
                {activeHardware.slice(0, 3).map((h) => (
                  <li key={h._id} className="flex items-center justify-between text-xs text-espresso-700/70">
                    <span className="truncate pr-2">{h.name}</span>
                    <span className="shrink-0 font-medium text-espresso-800">{formatVnd(h.priceVnd)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-espresso-900/5 p-5 shadow-sm">
          <Wrench className="text-clay-500 mb-2" size={22} />
          <p className="font-medium text-espresso-900 mb-1">Phí dịch vụ thiết kế (Setup Fee)</p>
          <p className="text-xs text-espresso-700/60 mb-3">Đội ngũ hỗ trợ thiết kế Landing Page, chụp ảnh bìa, viết bio thương hiệu theo phong cách riêng.</p>
          <p className="text-sm font-semibold text-espresso-900">Liên hệ báo giá</p>
        </div>
      </div>

      {payingPlan && (
        <PaymentModal plan={payingPlan} businessId={business._id} onClose={() => setPayingPlan(null)} onSuccess={handlePaymentSuccess} />
      )}
      {unlocked && <UnlockToast features={unlocked} onDone={() => setUnlocked(null)} />}
    </div>
  );
}
