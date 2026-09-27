import { useEffect, useState } from "react";
import { Eye, EyeOff, Save, Plus, X } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState({}); // { [id]: draftFields }
  const [savingId, setSavingId] = useState(null);
  const [featureDraft, setFeatureDraft] = useState({});

  const load = () => {
    superAdminApi.get("/super-admin/plans").then((res) => setPlans(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const getDraft = (plan) => editing[plan._id] || plan;
  const setField = (plan, field, value) =>
    setEditing((e) => ({ ...e, [plan._id]: { ...getDraft(plan), [field]: value } }));

  const handleSave = async (plan) => {
    setSavingId(plan._id);
    const draft = getDraft(plan);
    try {
      const res = await superAdminApi.put(`/super-admin/plans/${plan._id}`, {
        name: draft.name,
        priceVnd: Number(draft.priceVnd),
        priceLabel: draft.priceLabel,
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
    } finally {
      setSavingId(null);
    }
  };

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

  return (
    <div className="p-5 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-white">Gói & Thanh toán</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Chỉnh sửa giá, tên và tính năng hiển thị của từng gói — thay đổi áp dụng ngay trên Landing Page và Cửa hàng, không cần sửa code.
      </p>

      <div className="mt-6 space-y-4">
        {plans.map((plan) => {
          const draft = getDraft(plan);
          const dirty = !!editing[plan._id];
          return (
            <div key={plan._id} className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="grid sm:grid-cols-2 gap-3 flex-1 min-w-[260px]">
                  <div>
                    <label className="text-xs font-medium text-neutral-500">Tên gói</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setField(plan, "name", e.target.value)}
                      className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500">Nhãn giá hiển thị</label>
                    <input
                      value={draft.priceLabel}
                      onChange={(e) => setField(plan, "priceLabel", e.target.value)}
                      placeholder="vd: 99.000đ/tháng"
                      className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500">Giá (VNĐ, dùng để tính MRR)</label>
                    <input
                      type="number"
                      value={draft.priceVnd}
                      onChange={(e) => setField(plan, "priceVnd", e.target.value)}
                      className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500">Giới hạn chi nhánh</label>
                    <input
                      type="number"
                      value={draft.branchLimit}
                      onChange={(e) => setField(plan, "branchLimit", e.target.value)}
                      className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-neutral-500">Mô tả ngắn</label>
                    <input
                      value={draft.tagline}
                      onChange={(e) => setField(plan, "tagline", e.target.value)}
                      className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setField(plan, "isActive", !draft.isActive)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                      draft.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/8 text-neutral-500"
                    }`}
                  >
                    {draft.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {draft.isActive ? "Đang hiển thị" : "Đang ẩn"}
                  </button>
                  <button
                    onClick={() => handleSave(plan)}
                    disabled={!dirty || savingId === plan._id}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white disabled:opacity-40"
                  >
                    <Save size={14} /> {savingId === plan._id ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-neutral-500">Tính năng hiển thị</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(draft.features || []).map((f, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-xs bg-white/5 text-neutral-400 rounded-full pl-3 pr-1.5 py-1">
                      {f}
                      <button onClick={() => removeFeature(plan, idx)} className="text-neutral-600 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    value={featureDraft[plan._id] || ""}
                    onChange={(e) => setFeatureDraft((f) => ({ ...f, [plan._id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature(plan))}
                    placeholder="Thêm tính năng..."
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                  <button onClick={() => addFeature(plan)} className="p-1.5 rounded-lg bg-white/5 text-neutral-500 hover:text-orange-400">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 text-sm text-neutral-400">
        Duyệt thanh toán/chuyển khoản thủ công cho các đơn hàng phần cứng nằm ở mục{" "}
        <span className="font-medium text-white">Đơn hàng</span> — cổng thanh toán SePay tự động cho Cửa hàng công khai sẽ được nối vào ở round tiếp theo.
      </div>
    </div>
  );
}
