import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  Zap,
  Menu,
  X,
  ExternalLink,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext";
import superAdminApi from "../../api/superAdminAxios";
import { ACTIVITY_META, timeAgo } from "../../lib/superadminFormat";
import { ToastProvider } from "./Toast";

const NAV_ITEMS = [
  { to: "/super-admin/dashboard", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/super-admin/tenants", label: "Khách thuê", icon: Building2 },
  { to: "/super-admin/plans", label: "Gói", icon: Layers },
  { to: "/super-admin/orders", label: "Đơn hàng", icon: PackageSearch },
  { to: "/super-admin/tickets", label: "Hỗ trợ", icon: LifeBuoy },
  { to: "/super-admin/cms", label: "CMS", icon: FileText },
];

const SETTINGS_PATH = "/super-admin/settings";

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

function SuperAdminShell() {
  const { superAdmin, logout } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onSettings = location.pathname.startsWith(SETTINGS_PATH);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/super-admin/login");
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
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
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <div className="font-dash min-h-screen bg-neutral-950 text-white">
      {/* Top pill navbar */}
      <div className="sticky top-0 z-40 px-3 sm:px-5 pt-3 sm:pt-4 pb-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md border border-white/5 rounded-full pl-3 pr-2 py-2 shadow-xl shadow-black/40">
          <span className="flex items-center gap-2 pr-2 shrink-0">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Zap size={15} className="text-white" fill="white" />
            </span>
            <span className="hidden sm:inline font-semibold text-sm tracking-tight">O2O SuperAdmin</span>
          </span>

          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className="relative">
                {({ isActive }) => (
                  <span
                    className={`relative z-10 block px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive ? "text-neutral-900" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="superadmin-active-pill"
                        className="absolute inset-0 bg-white rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={submitSearch} className="flex items-center">
                  <input
                    ref={searchRef}
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => !search && setSearchOpen(false)}
                    placeholder="Tìm khách thuê..."
                    className="w-40 sm:w-56 bg-white/10 rounded-full px-4 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </form>
              ) : (
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setTimeout(() => searchRef.current?.focus(), 0);
                  }}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Tìm kiếm"
                >
                  <Search size={16} />
                </button>
              )}
            </div>

            <div className="relative hidden sm:block" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Thông báo"
              >
                <Bell size={16} />
                {activity.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-40"
                  >
                    <div className="px-4 py-3 border-b border-white/5 font-medium text-sm">Hoạt động gần đây</div>
                    <div className="max-h-80 overflow-y-auto">
                      {activity.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-neutral-500">Chưa có hoạt động nào</div>
                      ) : (
                        activity.slice(0, 6).map((a, i) => {
                          const meta = ACTIVITY_META[a.type] || ACTIVITY_META.signup;
                          const Icon = meta.icon;
                          return (
                            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5">
                              <span className={`w-8 h-8 rounded-full ${meta.darkBg} ${meta.darkTone} flex items-center justify-center shrink-0`}>
                                <Icon size={14} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm text-neutral-300 leading-snug">{a.text}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">{timeAgo(a.at)}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <NavLink
                      to="/super-admin/dashboard"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-orange-400 hover:bg-white/5 border-t border-white/5"
                    >
                      Xem trên Tổng quan <ChevronRight size={13} />
                    </NavLink>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className={`flex items-center gap-1 pl-1 pr-2 py-1 rounded-full hover:bg-white/10 transition-all ${
                  onSettings || profileOpen ? "bg-white/10 ring-1 ring-orange-500/40" : "bg-white/5"
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-neutral-900 text-[11px] font-bold flex items-center justify-center">
                  {initialsOf(superAdmin?.name || superAdmin?.email)}
                </span>
                <ChevronDown size={14} className={`text-neutral-400 hidden sm:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-60 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-40"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <div className="text-sm font-medium truncate">{superAdmin?.name || "Super Admin"}</div>
                      <div className="text-xs text-neutral-500 truncate">{superAdmin?.email}</div>
                    </div>
                    <NavLink
                      to={SETTINGS_PATH}
                      onClick={() => setProfileOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 ${
                        onSettings ? "text-orange-400" : "text-neutral-300"
                      }`}
                    >
                      <Settings size={15} /> Cài đặt hệ thống
                      {onSettings && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
                    </NavLink>
                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5"
                    >
                      <ExternalLink size={15} /> Quay lại trang chủ
                    </a>
                    <div className="border-t border-white/5" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={15} /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Mở menu"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-neutral-950 px-5 py-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Zap size={15} className="text-white" fill="white" />
              </span>
              <span className="font-semibold text-sm">O2O SuperAdmin</span>
            </span>
            <button onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
              <X size={22} />
            </button>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? "bg-white text-neutral-900" : "text-neutral-400"
                  }`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-1.5 pt-4 border-t border-white/10">
            <NavLink
              to={SETTINGS_PATH}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive ? "bg-white text-neutral-900" : "text-neutral-300 bg-white/5"
                }`
              }
            >
              <Settings size={18} /> Cài đặt hệ thống
            </NavLink>
            <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-300 bg-white/5">
              <ExternalLink size={18} /> Quay lại trang chủ
            </a>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400">
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}

export default function SuperAdminLayout() {
  return (
    <ToastProvider>
      <SuperAdminShell />
    </ToastProvider>
  );
}
