import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, LayoutDashboard, LogOut, Package, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext";
import { useCart } from "../../context/CartContext";
import { CLIENT_WEB_URL } from "../../lib/config";
import Avatar from "../common/Avatar";
import NotificationBell from "../common/NotificationBell";

export const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/about", label: "Giới thiệu" },
  { to: "/store", label: "Bảng giá & Cửa hàng" },
  { to: "/contact", label: "Liên hệ" },
];

// Giỏ hàng có huy hiệu số lượng — hiện với mọi người (khách vãng lai cũng có giỏ).
function CartButton({ count }) {
  return (
    <Link
      to="/cart"
      aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-espresso-800 transition-colors hover:bg-espresso-900/[0.07] sm:h-9 sm:w-9"
    >
      <ShoppingBag size={18} />
      <AnimatePresence>
        {count > 0 && (
          // key cố định: đổi số lượng chỉ đổi chữ, không tạo huy hiệu mới (tránh số cũ đè số mới lúc animation thoát).
          <motion.span
            key="badge"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-espresso-950 ring-2 ring-cream-50"
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

// Nút "Tải app" trỏ sang Client Web (app khách hàng thật). Trên mobile nút này nằm ở thanh điều hướng dưới.
function DownloadButton() {
  return (
    <a
      href={CLIENT_WEB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden items-center justify-center gap-1.5 rounded-full bg-espresso-900 px-4 py-2 text-sm font-medium text-cream-50 transition-colors hover:bg-espresso-800 md:inline-flex"
    >
      <Download size={14} /> Tải app
    </a>
  );
}

// Avatar tròn của người đang đăng nhập.
//  • Mobile : chạm là vào thẳng trang tài khoản (không có menu xổ) — thao tác 1 chạm.
//  • Desktop: bấm mở menu nhỏ (tài khoản, đơn hàng, đăng xuất).
function AccountMenu({ user, isSuperAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const home = isSuperAdmin ? "/super-admin/dashboard" : "/account";
  const active = location.pathname === home;

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ringCls = active || open ? "ring-2 ring-espresso-900/30" : "ring-2 ring-transparent hover:ring-espresso-900/15";
  const item = "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-espresso-800 transition-colors hover:bg-cream-100";

  return (
    <div ref={ref} className="relative">
      <Link to={home} aria-label="Tài khoản của tôi" className={`flex rounded-full transition-shadow md:hidden ${ringCls}`}>
        <Avatar name={user.name} size={36} />
      </Link>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Tài khoản của tôi"
        aria-expanded={open}
        className={`hidden rounded-full transition-shadow md:flex ${ringCls}`}
      >
        <Avatar name={user.name} size={34} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-3 hidden w-64 overflow-hidden rounded-2xl bg-cream-50 shadow-[0_24px_60px_-20px_rgba(42,24,16,0.55)] ring-1 ring-espresso-900/10 md:block"
          >
            <div className="flex items-center gap-3 border-b border-cream-200 px-4 py-3.5">
              <Avatar name={user.name} size={40} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-espresso-950">{user.name}</div>
                <div className="truncate text-xs text-espresso-600">{user.email}</div>
              </div>
            </div>
            <div className="py-1.5">
              {isSuperAdmin ? (
                <Link to="/super-admin/dashboard" className={item}>
                  <LayoutDashboard size={16} className="text-espresso-600" /> Vào Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/account" className={item}>
                    <User size={16} className="text-espresso-600" /> Tài khoản của tôi
                  </Link>
                  <Link to="/account?tab=orders" className={item}>
                    <Package size={16} className="text-espresso-600" /> Đơn hàng
                  </Link>
                </>
              )}
            </div>
            <div className="border-t border-cream-200 py-1.5">
              <button onClick={onLogout} className={`${item} hover:!bg-clay-500/10 hover:text-clay-500`}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const { superAdmin, logout: logoutSuperAdmin } = useSuperAdminAuth();
  const { count } = useCart();

  // Thanh điều hướng trong suốt ở đầu trang, chuyển sang kính mờ khi bắt đầu cuộn.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Khách và Super Admin dùng chung khung header; ưu tiên tài khoản khách nếu (hiếm) cả hai cùng đăng nhập.
  const user = admin || superAdmin;
  const isSuperAdmin = !admin && Boolean(superAdmin);

  const handleLogout = () => {
    if (admin) logout();
    else logoutSuperAdmin();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled
          ? "bg-cream-50/80 backdrop-blur-xl shadow-[0_1px_0_rgba(59,35,24,0.08),0_10px_30px_-18px_rgba(59,35,24,0.35)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-5">
        <Link to="/" className="shrink-0 font-display text-xl font-semibold text-espresso-900">
          O2O <span className="text-clay-500">Brand</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-espresso-950" : "text-espresso-700 hover:text-espresso-950"
                }`}
              >
                {active && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 rounded-full bg-espresso-900/[0.07]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Cụm bên phải giống nhau ở mobile và desktop: chuông · giỏ hàng · avatar (hoặc "Tham gia"). */}
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {user && <NotificationBell scope={isSuperAdmin ? "superadmin" : "tenant"} variant="light" />}
          <CartButton count={count} />
          {user ? (
            <AccountMenu user={user} isSuperAdmin={isSuperAdmin} onLogout={handleLogout} />
          ) : (
            <Link to="/login" className="ml-1 rounded-full bg-espresso-900/[0.07] px-4 py-2 text-sm font-medium text-espresso-900 transition-colors hover:bg-espresso-900/[0.12]">
              Tham gia
            </Link>
          )}
          <DownloadButton />
        </div>
      </div>
    </header>
  );
}
