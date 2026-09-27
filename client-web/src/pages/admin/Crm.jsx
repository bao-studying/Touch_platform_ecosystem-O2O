import { useEffect, useMemo, useState } from "react";
import { Phone, MessageCircle, Download, Search, Users } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import { getPlanLimits } from "../../utils/planLimits";
import PlanLockBadge from "../../components/admin/PlanLockBadge";
import { SkeletonList } from "../../components/admin/Skeleton";

export default function Crm() {
  const { business } = useBusiness();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!business) return;
    api
      .get(`/leads/business/${business._id}`)
      .then((res) => setLeads(res.data))
      .finally(() => setLoading(false));
  }, [business]);

  const filtered = useMemo(() => {
    if (!query) return leads;
    const q = query.toLowerCase();
    return leads.filter((l) => l.name?.toLowerCase().includes(q) || l.phone?.includes(q));
  }, [leads, query]);

  const limits = getPlanLimits(business?.plan);

  const handleExport = async () => {
    if (!limits.hasCrmExport) return;
    const token = localStorage.getItem("o2o_token");
    const base = api.defaults.baseURL;
    const res = await fetch(`${base}/leads/business/${business._id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-${business.slug}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const ExportButton = ({ full }) =>
    limits.hasCrmExport ? (
      <button
        onClick={handleExport}
        className={`${full ? "w-full" : "hidden md:flex"} items-center justify-center gap-1.5 rounded-xl bg-espresso-800 text-cream-50 px-3.5 py-2.5 text-sm font-medium`}
      >
        <Download size={16} /> Xuất Excel/CSV
      </button>
    ) : (
      <div className={`${full ? "w-full" : "hidden md:flex"} items-center justify-center gap-2 rounded-xl bg-espresso-900/5 px-3.5 py-2.5 text-sm text-espresso-700/50`}>
        Xuất CSV <PlanLockBadge requiredPlan="level1" />
      </div>
    );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8">
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-espresso-950">CRM — Khách hàng thân thiết</h1>
          <p className="text-sm text-espresso-700/60">{leads.length} khách hàng đã đăng ký</p>
        </div>
        <ExportButton />
      </div>

      {!limits.hasLoyalty && (
        <div className="rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/25 p-4 flex items-start gap-3">
          <Users size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-espresso-900 font-medium">Widget thu thập khách hàng chưa hiển thị</p>
            <p className="text-xs text-espresso-700/60 mt-0.5">Nâng cấp lên Level 1 để bắt đầu thu thập khách hàng thân thiết trên Landing Page.</p>
          </div>
          <PlanLockBadge requiredPlan="level1" />
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-700/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc số điện thoại..."
          className="w-full rounded-xl border border-espresso-900/15 pl-9 pr-3 py-2.5 text-sm bg-white"
        />
      </div>

      {/* Mobile: card view */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((lead) => (
          <div key={lead._id} className="rounded-2xl bg-white ring-1 ring-espresso-900/5 p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-espresso-900 truncate">{lead.name}</p>
              <p className="text-xs text-espresso-700/60">{lead.phone}</p>
              {lead.branch && <p className="text-[11px] text-espresso-700/40 mt-0.5">{lead.branch}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="w-9 h-9 rounded-full bg-sage-400/15 text-sage-500 flex items-center justify-center">
                  <Phone size={16} />
                </a>
              )}
              {lead.zalo || lead.phone ? (
                <a
                  href={`https://zalo.me/${(lead.zalo || lead.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-sky-500/15 text-sky-600 flex items-center justify-center"
                >
                  <MessageCircle size={16} />
                </a>
              ) : null}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-espresso-900/5 flex items-center justify-center">
              <Users size={24} className="text-espresso-700/30" />
            </div>
            <p className="text-sm text-espresso-700/60">
              {leads.length === 0 ? "Chưa có khách hàng thân thiết nào — chia sẻ link để bắt đầu thu thập." : "Không có khách hàng nào khớp tìm kiếm."}
            </p>
          </div>
        )}
        <ExportButton full />
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block rounded-2xl bg-white ring-1 ring-espresso-900/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-espresso-900/5 text-espresso-700/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Họ tên</th>
              <th className="text-left px-4 py-3 font-medium">SĐT</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Chi nhánh</th>
              <th className="text-left px-4 py-3 font-medium">Điểm</th>
              <th className="text-left px-4 py-3 font-medium">Ngày đăng ký</th>
              <th className="text-left px-4 py-3 font-medium">Liên hệ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead._id} className="border-t border-espresso-900/5 hover:bg-cream-50">
                <td className="px-4 py-3 font-medium text-espresso-900">{lead.name}</td>
                <td className="px-4 py-3 text-espresso-700/80">{lead.phone}</td>
                <td className="px-4 py-3 text-espresso-700/80">{lead.email}</td>
                <td className="px-4 py-3 text-espresso-700/80">{lead.branch}</td>
                <td className="px-4 py-3 text-espresso-700/80">{lead.points}</td>
                <td className="px-4 py-3 text-espresso-700/60">{new Date(lead.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="text-sage-500">
                        <Phone size={15} />
                      </a>
                    )}
                    <a href={`https://zalo.me/${(lead.zalo || lead.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sky-600">
                      <MessageCircle size={15} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-espresso-900/5 flex items-center justify-center">
              <Users size={24} className="text-espresso-700/30" />
            </div>
            <p className="text-sm text-espresso-700/60">
              {leads.length === 0 ? "Chưa có khách hàng thân thiết nào — chia sẻ link để bắt đầu thu thập." : "Không có khách hàng nào khớp tìm kiếm."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
