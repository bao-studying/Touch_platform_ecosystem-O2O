import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Lock, Unlock, KeyRound, LogIn, Building2, Download, UserPlus, ChevronDown } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import Modal from "../../components/superadmin/Modal";
import { PLAN_BADGE } from "../../lib/superadminFormat";

const PLAN_FILTERS = [
  { value: "all", label: "Tất cả gói" },
  { value: "free", label: "Free" },
  { value: "level1", label: "Level 1" },
  { value: "level2", label: "Level 2" },
  { value: "level3", label: "Enterprise" },
];
const STATUS_FILTERS = [
  { value: "all", label: "Mọi trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "locked", label: "Đã khóa" },
];

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function StatusPill({ locked }) {
  return locked ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/15 ring-1 ring-red-500/20 rounded-full px-2.5 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>
      Đã khóa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-500/20 rounded-full px-2.5 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      Hoạt động
    </span>
  );
}

export default function Tenants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenants, setTenants] = useState([]);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'lock' | 'reset' | null
  const [newPassword, setNewPassword] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [msg, setMsg] = useState("");

  const load = (query) => {
    superAdminApi.get("/super-admin/tenants", { params: { q: query } }).then((res) => setTenants(res.data)).catch(() => {});
  };

  useEffect(() => {
    const t = setTimeout(() => {
      load(q);
      setSearchParams(q ? { q } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const plan = t.business?.plan || "free";
      if (planFilter !== "all" && plan !== planFilter) return false;
      if (statusFilter === "active" && t.isLocked) return false;
      if (statusFilter === "locked" && !t.isLocked) return false;
      return true;
    });
  }, [tenants, planFilter, statusFilter]);

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setNewPassword("");
    setLockReason("");
    setMsg("");
  };

  const handleToggleLock = async (tenant, isLocked) => {
    await superAdminApi.put(`/super-admin/tenants/${tenant._id}/lock`, { isLocked, reason: lockReason });
    closeModal();
    load(q);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) return setMsg("Mật khẩu cần tối thiểu 6 ký tự");
    await superAdminApi.put(`/super-admin/tenants/${selected._id}/reset-password`, { newPassword });
    setMsg("Đã đặt lại mật khẩu thành công");
  };

  const handleLoginAs = async (tenant) => {
    const res = await superAdminApi.post(`/super-admin/tenants/${tenant._id}/login-as`);
    const clientWebUrl = import.meta.env.VITE_CLIENT_WEB_URL || "http://localhost:5173";
    window.open(`${clientWebUrl}/admin?token=${res.data.token}`, "_blank");
  };

  const handleExportCsv = () => {
    const header = ["Tên", "Email", "Doanh nghiệp", "Gói", "Trạng thái", "Ngày đăng ký"];
    const rows = filtered.map((t) => [
      t.name,
      t.email,
      t.business?.name || "",
      PLAN_BADGE[t.business?.plan || "free"]?.label || "Free",
      t.isLocked ? "Đã khóa" : "Hoạt động",
      new Date(t.createdAt).toLocaleDateString("vi-VN"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khach-thue-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 md:p-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản lý khách thuê</h1>
          <p className="text-sm text-neutral-500 mt-1">{filtered.length} / {tenants.length} tài khoản</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full rounded-xl border border-white/10 bg-neutral-900 text-white placeholder:text-neutral-600 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>

        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-3.5 pr-9 py-2.5 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
          >
            {PLAN_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-3.5 pr-9 py-2.5 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600" />
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/5 transition-colors"
          >
            <Download size={15} /> Xuất CSV
          </button>
          <span className="relative group/addbtn">
            <button
              disabled
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              <UserPlus size={15} /> Thêm khách thuê
            </button>
            <span className="pointer-events-none absolute right-0 top-11 w-56 text-[11px] leading-relaxed text-neutral-400 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 shadow-lg opacity-0 group-hover/addbtn:opacity-100 transition-opacity z-10">
              Khách thuê tự đăng ký qua trang giới thiệu công khai — Super Admin hiện chưa hỗ trợ tạo tài khoản hộ.
            </span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Chủ tài khoản</th>
              <th className="px-5 py-3 font-medium hidden sm:table-cell">Doanh nghiệp</th>
              <th className="px-5 py-3 font-medium">Gói</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const plan = t.business?.plan || "free";
              const badge = PLAN_BADGE[plan] || PLAN_BADGE.free;
              return (
                <tr key={t._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-semibold flex items-center justify-center">
                          {initialsOf(t.name)}
                        </div>
                        <span
                          className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-neutral-900 ${
                            t.isLocked ? "bg-red-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{t.name}</div>
                        <div className="text-neutral-600 text-xs truncate">{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-neutral-400">
                    {t.business ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-white/10 text-neutral-500 flex items-center justify-center shrink-0">
                          <Building2 size={13} />
                        </span>
                        {t.business.name}
                      </span>
                    ) : (
                      <span className="text-neutral-600">Chưa tạo</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex text-xs font-medium rounded-full px-2.5 py-1 ${badge.className}`}>{badge.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill locked={t.isLocked} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <span className="relative group/tt">
                        <button
                          onClick={() => handleLoginAs(t)}
                          className="p-2 rounded-lg text-neutral-500 hover:bg-orange-500/15 hover:text-orange-400 transition-colors"
                        >
                          <LogIn size={16} />
                        </button>
                        <span className="pointer-events-none absolute right-0 -top-9 whitespace-nowrap text-[11px] bg-white text-neutral-900 rounded-lg px-2 py-1 opacity-0 group-hover/tt:opacity-100 transition-opacity">
                          Đăng nhập giả lập
                        </span>
                      </span>
                      <span className="relative group/tt">
                        <button
                          onClick={() => {
                            setSelected(t);
                            setModalMode("reset");
                          }}
                          className="p-2 rounded-lg text-neutral-500 hover:bg-orange-500/15 hover:text-orange-400 transition-colors"
                        >
                          <KeyRound size={16} />
                        </button>
                        <span className="pointer-events-none absolute right-0 -top-9 whitespace-nowrap text-[11px] bg-white text-neutral-900 rounded-lg px-2 py-1 opacity-0 group-hover/tt:opacity-100 transition-opacity">
                          Đặt lại mật khẩu
                        </span>
                      </span>
                      <span className="relative group/tt">
                        <button
                          onClick={() => {
                            setSelected(t);
                            setModalMode("lock");
                          }}
                          className="p-2 rounded-lg text-neutral-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                        >
                          {t.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        <span className="pointer-events-none absolute right-0 -top-9 whitespace-nowrap text-[11px] bg-white text-neutral-900 rounded-lg px-2 py-1 opacity-0 group-hover/tt:opacity-100 transition-opacity">
                          {t.isLocked ? "Mở khóa" : "Khóa tài khoản"}
                        </span>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="px-5 py-10 text-center text-neutral-600 text-sm">Không có tài khoản nào khớp bộ lọc</div>}
      </div>

      {modalMode === "reset" && selected && (
        <Modal title={`Đặt lại mật khẩu — ${selected.name}`} onClose={closeModal}>
          <input
            type="text"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          {msg && <p className="text-sm text-neutral-400 mt-2">{msg}</p>}
          <button
            onClick={handleResetPassword}
            className="w-full mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Xác nhận đặt lại
          </button>
        </Modal>
      )}

      {modalMode === "lock" && selected && (
        <Modal title={selected.isLocked ? `Mở khóa — ${selected.name}` : `Khóa tài khoản — ${selected.name}`} onClose={closeModal}>
          {!selected.isLocked && (
            <input
              type="text"
              placeholder="Lý do khóa (tùy chọn)"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          )}
          <button
            onClick={() => handleToggleLock(selected, !selected.isLocked)}
            className={`w-full mt-4 rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${
              selected.isLocked ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {selected.isLocked ? "Mở khóa tài khoản" : "Xác nhận khóa"}
          </button>
        </Modal>
      )}
    </div>
  );
}
