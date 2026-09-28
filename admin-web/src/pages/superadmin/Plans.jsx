import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Save, Plus, X, Check, Loader2, Undo2, CircleDollarSign, GitBranch, CheckCircle2 } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import { useToast } from "../../components/superadmin/Toast";
import { PLAN_COLORS } from "../../lib/superadminFormat";

const FIELDS = ["name", "priceVnd", "tagline", "features", "branchLimit", "isActive"];

// Phải khớp buildPriceLabel ở admin-server/controllers/planConfigController.js — nhãn hiển thị luôn SINH từ giá thật.
const priceLabel = (n) => (Number(n) === 0 ? "0đ" : `${Number(n || 0).toLocaleString("vi-VN")}đ/tháng`);
const formatNum = (n) => (n === "" || n === null || n === undefined ? "" : Number(n).toLocaleString("vi-VN"));

const sameValue = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export default function Plans() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState({}); // { [id]: draft }
  const [saving, setSaving] = useState({}); // { [id]: true }
  const [saved, setSaved] = useState({}); // { [id]: true } — hiệu ứng "đã lưu" ~2s
  const [failed, setFailed] = useState({}); // { [id]: true } — rung nhẹ khi lỗi
  const [featureDraft, setFeatureDraft] = useState({});
  const timers = useRef({});

  const load = () => {
    setLoadError(false);
    superAdminApi
      .get("/super-admin/plans")
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  const getDraft = (plan) => editing[plan._id] || plan;
  const setField = (plan, field, value) =>
    setEditing((e) => ({ ...e, [plan._id]: { ...getDraft(plan), [field]: value } }));

  // "Dirty" thật sự: so sánh với dữ liệu gốc — sửa rồi trả về giá trị cũ thì KHÔNG còn tính là thay đổi.
  const isDirty = (plan) => {
    const d = editing[plan._id];
    return !!d && FIELDS.some((f) => !sameValue(d[f], plan[f]));
  };
  const dirtyPlans = useMemo(() => plans.filter(isDirty), [plans, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (setter, id, ms) => {
    setter((s) => ({ ...s, [id]: true }));
    clearTimeout(timers.current[`${id}-${ms}`]);
    timers.current[`${id}-${ms}`] = setTimeout(() => setter((s) => ({ ...s, [id]: false })), ms);
  };

  const validate = (draft) => {
    if (!String(draft.name || "").trim()) return "Tên gói không được để trống";
    if (draft.priceVnd === "" || Number(draft.priceVnd) < 0 || Number.isNaN(Number(draft.priceVnd))) return "Vui lòng nhập giá hợp lệ (≥ 0)";
    if (Number(draft.branchLimit) < 0 || Number.isNaN(Number(draft.branchLimit))) return "Giới hạn chi nhánh không hợp lệ";
    return null;
  };

  const handleSave = async (plan, { silent = false } = {}) => {
    const draft = getDraft(plan);
    const problem = validate(draft);
    if (problem) {
      flash(setFailed, plan._id, 600);
      toast.error(`Chưa thể lưu gói ${plan.name}`, problem);
      return false;
    }
    setSaving((s) => ({ ...s, [plan._id]: true }));
    try {
      const res = await superAdminApi.put(`/super-admin/plans/${plan._id}`, {
        name: draft.name.trim(),
        priceVnd: Number(draft.priceVnd),
        tagline: draft.tagline,
        features: draft.features,
        branchLimit: Number(draft.branchLimit),
        isActive: draft.isActive,
      });
      setPlans((ps) => ps.map((p) => (p._id === plan._id ? res.data : p)));
      setEditing((e) => {
        const next = { ...e };
        delete next[plan._id];
        return next;
      });
      flash(setSaved, plan._id, 2200);
      if (!silent) toast.success(`Đã lưu gói ${res.data.name}`, `Khách thấy và bị thu: ${priceLabel(res.data.priceVnd)} — áp dụng ngay.`);
      return true;
    } catch (err) {
      flash(setFailed, plan._id, 600);
      toast.error(`Lưu gói ${plan.name} thất bại`, err.response?.data?.message || "Kiểm tra Admin Server có đang chạy không rồi thử lại.");
      return false;
    } finally {
      setSaving((s) => ({ ...s, [plan._id]: false }));
    }
  };

  const handleSaveAll = async () => {
    const targets = [...dirtyPlans];
    let ok = 0;
    for (const p of targets) if (await handleSave(p, { silent: true })) ok += 1;
    if (ok) toast.success(`Đã lưu ${ok}/${targets.length} gói`, "Mọi thay đổi đã được áp dụng lên Landing Page và Cửa hàng.");
  };

  const handleDiscard = (plan) =>
    setEditing((e) => {
      const next = { ...e };
      delete next[plan._id];
      return next;
    });

  // Ctrl/Cmd + S = lưu tất cả gói đang có thay đổi
  const saveAllRef = useRef(handleSaveAll);
  saveAllRef.current = handleSaveAll;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveAllRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addFeature = (plan) => {
    const text = (featureDraft[plan._id] || "").trim();
    if (!text) return;
    setField(plan, "features", [...(getDraft(plan).features || []), text]);
    setFeatureDraft((f) => ({ ...f, [plan._id]: "" }));
  };

  const removeFeature = (plan, idx) => {
    const next = [...getDraft(plan).features];
    next.splice(idx, 1);
    setField(plan, "features", next);
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/40 transition";

  return (
    <div className="p-4 sm:p-5 md:p-8 max-w-5xl pb-32">
      <h1 className="text-2xl font-semibold tracking-tight">Gói & Thanh toán</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Chỉnh giá, tên và tính năng từng gói — áp dụng ngay trên Landing Page, Cửa hàng và mã QR thanh toán, không cần sửa code.{" "}
        <kbd className="text-[10px] font-medium text-neutral-400 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5">Ctrl/⌘ + S</kbd> để lưu nhanh.
      </p>

      {loadError && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-300 flex items-center justify-between gap-3">
          Không tải được danh sách gói. Kiểm tra Admin Server có đang chạy không.
          <button onClick={load} className="text-xs font-medium bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {plans.map((plan, i) => {
          const draft = getDraft(plan);
          const dirty = isDirty(plan);
          const isSaving = !!saving[plan._id];
          const justSaved = !!saved[plan._id];
          const didFail = !!failed[plan._id];
          const color = PLAN_COLORS[plan.planKey] || "#F97316";

          return (
            <motion.div
              key={plan._id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, x: didFail ? [0, -6, 6, -4, 4, 0] : 0 }}
              transition={{ delay: didFail ? 0 : i * 0.06, duration: didFail ? 0.4 : 0.35 }}
              className={`relative rounded-3xl border p-5 sm:p-6 bg-neutral-900 transition-[border-color,box-shadow] duration-500 ${
                justSaved
                  ? "border-emerald-500/50 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
                  : dirty
                  ? "border-orange-500/40 shadow-[0_0_0_4px_rgba(249,115,22,0.06)]"
                  : "border-white/5"
              }`}
            >
              {/* Header thẻ gói */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{plan.planKey}</span>
                  <AnimatePresence>
                    {dirty && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-orange-300 bg-orange-500/10 rounded-full px-2.5 py-1"
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400" />
                        </span>
                        Chưa lưu
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setField(plan, "isActive", !draft.isActive)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                      draft.isActive ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/8 text-neutral-500 hover:bg-white/12"
                    }`}
                  >
                    {draft.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {draft.isActive ? "Đang hiển thị" : "Đang ẩn"}
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="mt-5 grid sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500">Tên gói</label>
                  <input value={draft.name} onChange={(e) => setField(plan, "name", e.target.value)} className={`${inputCls} mt-1.5`} />
                </div>

                {/* GIÁ DUY NHẤT — gộp "Nhãn giá hiển thị" + "Giá (VNĐ)" */}
                <div>
                  <label className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                    <CircleDollarSign size={13} /> Giá gói (VNĐ/tháng)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      inputMode="numeric"
                      value={formatNum(draft.priceVnd)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setField(plan, "priceVnd", digits === "" ? "" : Number(digits));
                      }}
                      placeholder="0"
                      className={`${inputCls} pr-24 font-semibold tabular-nums`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">đ / tháng</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="text-neutral-500">Khách thấy:</span>
                    <motion.span
                      key={priceLabel(draft.priceVnd)}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-medium text-amber-300 bg-amber-500/10 rounded-full px-2.5 py-0.5"
                    >
                      {priceLabel(draft.priceVnd)}
                    </motion.span>
                    <span className="text-neutral-600">· cũng là số tiền thu qua QR & tính MRR</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                    <GitBranch size={13} /> Giới hạn chi nhánh
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={draft.branchLimit}
                    onChange={(e) => setField(plan, "branchLimit", e.target.value)}
                    className={`${inputCls} mt-1.5`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500">Mô tả ngắn</label>
                  <input value={draft.tagline || ""} onChange={(e) => setField(plan, "tagline", e.target.value)} className={`${inputCls} mt-1.5`} />
                </div>
              </div>

              {/* Tính năng */}
              <div className="mt-5">
                <label className="text-xs font-medium text-neutral-500">Tính năng hiển thị</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <AnimatePresence initial={false}>
                    {(draft.features || []).map((f, idx) => (
                      <motion.span
                        key={`${f}-${idx}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 text-xs bg-white/8 text-neutral-300 rounded-full pl-3 pr-1.5 py-1"
                      >
                        {f}
                        <button onClick={() => removeFeature(plan, idx)} className="text-neutral-500 hover:text-red-400 transition-colors">
                          <X size={12} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <input
                    value={featureDraft[plan._id] || ""}
                    onChange={(e) => setFeatureDraft((f) => ({ ...f, [plan._id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature(plan))}
                    placeholder="Thêm tính năng rồi nhấn Enter..."
                    className={`${inputCls} flex-1 !py-2`}
                  />
                  <button
                    onClick={() => addFeature(plan)}
                    className="px-3 rounded-xl bg-white/8 text-neutral-400 hover:text-orange-400 hover:bg-white/12 transition-colors"
                    aria-label="Thêm tính năng"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Thanh hành động — luôn hiển thị, KHÔNG bị mờ khi không có thay đổi */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end gap-2 min-h-[52px]">
                <AnimatePresence mode="wait" initial={false}>
                  {justSaved ? (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-4 py-2"
                    >
                      <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 16 }}>
                        <Check size={16} strokeWidth={3} />
                      </motion.span>
                      Đã lưu thành công
                    </motion.div>
                  ) : dirty || isSaving ? (
                    <motion.div key="dirty" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <button
                        onClick={() => handleDiscard(plan)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition-colors disabled:opacity-40"
                      >
                        <Undo2 size={14} /> Hoàn tác
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSave(plan)}
                        disabled={isSaving}
                        className="relative flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow disabled:opacity-80 disabled:cursor-wait"
                      >
                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <CheckCircle2 size={15} className="text-neutral-600" /> Đã đồng bộ — chưa có thay đổi nào
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 bg-orange-500/5 border border-orange-500/20 rounded-3xl p-5 text-sm text-neutral-400 leading-relaxed">
        Giá lưu ở đây là <span className="font-medium text-white">nguồn giá duy nhất</span>: nhãn hiển thị được sinh tự động từ giá, cùng một số tiền được dùng cho
        Cửa hàng, mã QR SePay và tính MRR. Duyệt chuyển khoản thủ công cho đơn phần cứng nằm ở mục <span className="font-medium text-white">Đơn hàng</span>.
      </div>

      {/* Thanh nổi: lưu tất cả */}
      <AnimatePresence>
        {dirtyPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-auto"
          >
            <div className="flex items-center justify-between gap-4 bg-white text-neutral-900 rounded-full pl-5 pr-2 py-2 shadow-2xl shadow-black/60">
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                {dirtyPlans.length} gói chưa lưu
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => dirtyPlans.forEach(handleDiscard)}
                  className="text-sm text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-full transition-colors"
                >
                  Hoàn tác
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSaveAll}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium px-4 py-2 rounded-full"
                >
                  <Save size={14} /> Lưu tất cả
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
