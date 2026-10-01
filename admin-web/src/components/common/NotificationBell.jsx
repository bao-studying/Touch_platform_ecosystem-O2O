import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, CheckCheck, CreditCard, LifeBuoy, Mail, ShoppingBag, Sparkles, UserPlus } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { timeAgo } from "../../lib/superadminFormat";

// Chuông thông báo + bộ đếm chưa đọc — dùng ở header của trang công khai (khách) và Super Admin, cả mobile lẫn desktop.
//  scope   "tenant" | "superadmin"   — nguồn thông báo
//  variant "light"  | "dark"         — giao diện theo nền của header

const TYPE_ICON = { order: ShoppingBag, payment: CreditCard, ticket: LifeBuoy, contact: Mail, signup: UserPlus, system: Sparkles };

const SKIN = {
  light: {
    button: "text-espresso-800 hover:bg-espresso-900/[0.07]",
    badge: "bg-clay-500 text-white ring-2 ring-cream-50",
    panel: "bg-cream-50 ring-1 ring-espresso-900/10 shadow-[0_24px_60px_-20px_rgba(42,24,16,0.55)]",
    head: "border-cream-200 text-espresso-950",
    sub: "text-espresso-600",
    action: "text-clay-500 hover:bg-cream-100",
    row: "hover:bg-cream-100/70 border-cream-100",
    unreadRow: "bg-amber-400/[0.09]",
    title: "text-espresso-950",
    body: "text-espresso-700",
    dot: "bg-clay-500",
    icon: "bg-cream-100 text-espresso-700",
    iconUnread: "bg-clay-500/10 text-clay-500",
    empty: "text-espresso-600",
    chip: "bg-clay-500/10 text-clay-500",
  },
  dark: {
    button: "bg-white/5 hover:bg-white/10 text-white",
    badge: "bg-orange-500 text-white ring-2 ring-neutral-900",
    panel: "bg-neutral-900 border border-white/10 shadow-2xl shadow-black/60",
    head: "border-white/5 text-white",
    sub: "text-neutral-500",
    action: "text-orange-400 hover:bg-white/5",
    row: "hover:bg-white/5 border-white/[0.04]",
    unreadRow: "bg-orange-500/[0.07]",
    title: "text-white",
    body: "text-neutral-400",
    dot: "bg-orange-500",
    icon: "bg-white/5 text-neutral-400",
    iconUnread: "bg-orange-500/15 text-orange-400",
    empty: "text-neutral-500",
    chip: "bg-orange-500/15 text-orange-400",
  },
};

export default function NotificationBell({ scope, variant = "light", className = "" }) {
  const { items, unread, loading, pulse, markRead, markAllRead } = useNotifications(scope);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const s = SKIN[variant];

  // Đóng khi bấm ra ngoài / Esc / đổi trang.
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
  useEffect(() => setOpen(false), [location.pathname, location.search]);

  const openItem = (n) => {
    markRead(n._id);
    setOpen(false);
    if (n.link && n.link.startsWith("/")) navigate(n.link);
  };

  return (
    // Mobile: panel bám theo header (phần tử định vị gần nhất) để rộng gần hết màn hình; ≥sm: bám vào nút chuông.
    <div ref={ref} className={`sm:relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9 ${s.button} ${open ? "ring-1 ring-current/20" : ""}`}
      >
        {/* key theo pulse: mỗi thông báo mới → phát lại animation lắc chuông */}
        <motion.span key={pulse} animate={pulse ? { rotate: [0, -16, 14, -10, 6, 0] } : {}} transition={{ duration: 0.7 }} className="flex origin-top">
          <Bell size={18} />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${s.badge}`}
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-label="Thông báo"
            className={`absolute inset-x-3 top-full z-50 mt-2 overflow-hidden rounded-2xl sm:inset-x-auto sm:right-0 sm:mt-3 sm:w-[380px] ${s.panel}`}
          >
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${s.head}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                Thông báo
                {unread > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.chip}`}>{unread} mới</span>}
              </div>
              {unread > 0 && (
                <button onClick={markAllRead} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${s.action}`}>
                  <CheckCheck size={13} /> Đọc tất cả
                </button>
              )}
            </div>

            <div className="max-h-[min(26rem,65vh)] overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`h-9 w-9 shrink-0 animate-pulse rounded-full ${s.icon}`} />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className={`h-3 w-2/3 animate-pulse rounded ${s.icon}`} />
                        <div className={`h-3 w-full animate-pulse rounded ${s.icon}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className={`flex flex-col items-center px-6 py-10 text-center text-sm ${s.empty}`}>
                  <BellOff size={26} className="mb-3 opacity-60" />
                  Chưa có thông báo nào
                </div>
              ) : (
                items.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Sparkles;
                  return (
                    <button
                      key={n._id}
                      onClick={() => openItem(n)}
                      className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 ${s.row} ${n.read ? "" : s.unreadRow}`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.read ? s.icon : s.iconUnread}`}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-snug ${s.title} ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</span>
                        {n.body && <span className={`mt-0.5 line-clamp-2 block text-xs leading-relaxed ${s.body}`}>{n.body}</span>}
                        <span className={`mt-1 block text-[11px] ${s.sub}`}>{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && <span aria-label="Chưa đọc" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
