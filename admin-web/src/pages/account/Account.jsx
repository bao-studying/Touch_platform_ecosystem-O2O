import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Lock, MapPin, Package, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Avatar from "../../components/common/Avatar";
import ProfileTab from "../../components/account/ProfileTab";
import AddressesTab from "../../components/account/AddressesTab";
import CartView from "../../components/account/CartView";
import OrdersTab from "../../components/account/OrdersTab";
import SecurityTab from "../../components/account/SecurityTab";

const TABS = [
  { id: "profile", label: "Hồ sơ", icon: User },
  { id: "addresses", label: "Địa chỉ", icon: MapPin },
  { id: "cart", label: "Giỏ hàng", icon: ShoppingBag },
  { id: "orders", label: "Đơn hàng", icon: Package },
  { id: "security", label: "Bảo mật", icon: Lock },
];

// Khu vực tài khoản của KHÁCH (chủ doanh nghiệp mua hàng ở trang giới thiệu) — thay cho việc đưa họ vào Dashboard.
// Dashboard chỉ dành cho Super Admin; khách quản lý hồ sơ, địa chỉ nhận hàng, giỏ hàng và đơn hàng ở đây.
export default function Account() {
  const { admin, logout } = useAuth();
  const { count } = useCart();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "profile";

  useEffect(() => {
    document.title = "Tài khoản — O2O Brand";
  }, []);

  const go = (id) => setParams({ tab: id }, { replace: true });

  return (
    <div>
      <header className="relative overflow-x-clip bg-paper-dots px-5 pb-6 pt-10 md:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={admin?.name || admin?.email || ""} size={64} ring />
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold text-espresso-950 sm:text-3xl">Xin chào, {admin?.name}</h1>
              <p className="truncate text-sm text-espresso-600">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-espresso-800 ring-1 ring-cream-200 transition-colors hover:text-clay-500"
          >
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="sticky top-16 z-30 px-5 py-3">
        <div className="mx-auto max-w-6xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div role="tablist" aria-label="Tài khoản" className="mx-auto flex w-max gap-1 rounded-full bg-cream-50/80 p-1 shadow-[0_10px_30px_-14px_rgba(59,35,24,0.45)] ring-1 ring-espresso-900/10 backdrop-blur-xl">
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => go(t.id)}
                  className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-cream-50" : "text-espresso-700 hover:text-espresso-950"
                  }`}
                >
                  {active && (
                    <motion.span layoutId="account-tab" className="absolute inset-0 rounded-full bg-espresso-900" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon size={15} />
                    {t.label}
                    {t.id === "cart" && count > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-semibold text-espresso-950">{count}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-4 md:pb-28">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "profile" && <ProfileTab />}
            {tab === "addresses" && <AddressesTab />}
            {tab === "cart" && <CartView embedded />}
            {tab === "orders" && <OrdersTab />}
            {tab === "security" && <SecurityTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
