import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Layers,
  PackageSearch,
  LifeBuoy,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Search,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext";
import superAdminApi from "../../api/superAdminAxios";
import { ACTIVITY_META, timeAgo } from "../../lib/superadminFormat";

const NAV_ITEMS = [
  { to: "/super-admin/dashboard", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/super-admin/tenants", label: "Khách thuê", icon: Building2 },
  { to: "/super-admin/plans", label: "Gói & Thanh toán", icon: Layers },
  { to: "/super-admin/orders", label: "Đơn hàng", icon: PackageSearch },
  { to: "/super-admin/tickets", label: "Hỗ trợ", icon: LifeBuoy },
  { to: "/super-admin/cms", label: "Nội dung trang chủ", icon: FileText },
  { to: "/super-admin/settings", label: "Cài đặt hệ thống", icon: Settings },
];

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "SA"
  );
}

export default function SuperAdminLayout() {
  const { superAdmin, logout } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/super-admin/login");
  };

  // Cmd/Ctrl+K focus vào ô tìm kiếm toàn cục — thói quen quen thuộc kiểu Linear/Vercel.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setNotifOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Đóng dropdown thông báo khi bấm ra ngoài.
  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    superAdminApi
      .get("/super-admin/overview")
      .then((res) => setActivity(res.data.recentActivity || []))
      .catch(() => {});
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/super-admin/tenants?q=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  };

  const SidebarContent = (
    <>
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <span className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-glow-blue">
          <ShieldCheck size={19} />
        </span>
        <div className="leading-tight">
          <div className="text-white font-semibold text-[15px] tracking-tight">O2O SuperAdmin</div>
          <div className="text-slate-400 text-[11px]">Bảng điều khiển nền tảng</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className="relative block">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="superadmin-active-pill"
                    className="absolute inset-0 bg-white/10 rounded-xl ring-1 ring-white/10 backdrop-blur-md"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive ? "text-white font-medium" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-blue-500" />}
                  <Icon size={18} className={isActive ? "text-blue-400" : ""} /> {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs font-semibold flex items-center justify-center">
              {initialsOf(superAdmin?.name || superAdmin?.email)}
            </div>
            <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{superAdmin?.name || "Super Admin"}</div>
            <div className="text-slate-400 text-xs truncate">{superAdmin?.email}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={18} /> Quay lại trang chủ
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="font-dash min-h-screen bg-slate-50 md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-6">
        {SidebarContent}
      </aside>

      {/* Topbar + drawer mobile */}
      <div className="md:hidden sticky top-0 z-40 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
            <ShieldCheck size={16} />
          </span>
          <span className="text-white font-semibold text-sm">O2O SuperAdmin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white" aria-label="Mở menu">
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-6 flex flex-col">
          <button onClick={() => setMobileOpen(false)} className="self-end text-white mb-4" aria-label="Đóng menu">
            <X size={24} />
          </button>
          <div className="flex-1 flex flex-col">{SidebarContent}</div>
        </div>
      )}

      {/* Nội dung chính */}
      <div className="flex-1 md:ml-64 min-w-0">
        {/* Topbar desktop: tìm kiếm toàn cục + thông báo */}
        <div className="hidden md:flex items-center gap-4 px-8 py-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
          <form onSubmit={submitSearch} className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khách thuê theo tên hoặc email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-14 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">
              ⌘K
            </kbd>
          </form>

          <div className="flex items-center gap-3 ml-auto">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Thông báo"
              >
                <Bell size={18} />
                {activity.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-900/10 overflow-hidden z-40"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 font-medium text-sm text-slate-900">
                      Hoạt động gần đây
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {activity.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400">Chưa có hoạt động nào</div>
                      ) : (
                        activity.slice(0, 6).map((a, i) => {
                          const meta = ACTIVITY_META[a.type] || ACTIVITY_META.signup;
                          const Icon = meta.icon;
                          return (
                            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                              <span className={`w-8 h-8 rounded-full ${meta.bg} ${meta.tone} flex items-center justify-center shrink-0`}>
                                <Icon size={14} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm text-slate-700 leading-snug">{a.text}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{timeAgo(a.at)}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <NavLink
                      to="/super-admin/dashboard"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border-t border-slate-100"
                    >
                      Xem trên Tổng quan <ChevronRight size={13} />
                    </NavLink>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xs font-semibold flex items-center justify-center">
                {initialsOf(superAdmin?.name || superAdmin?.email)}
              </div>
              <span className="text-sm text-slate-600 max-w-[160px] truncate">{superAdmin?.email}</span>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
