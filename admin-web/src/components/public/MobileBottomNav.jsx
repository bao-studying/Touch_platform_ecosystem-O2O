import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Home, Info, MessageCircle, Store } from "lucide-react";
import { CLIENT_WEB_URL } from "../../lib/config";

// Thanh điều hướng nổi ở đáy màn hình cho MOBILE — thay cho menu hamburger xổ xuống:
// mọi trang chính nằm trong tầm ngón cái, luôn thấy trang đang ở đâu, không cần mở menu rồi mới chọn.
const ITEMS = [
  { to: "/", label: "Trang chủ", icon: Home },
  { to: "/about", label: "Giới thiệu", icon: Info },
  { to: "/store", label: "Cửa hàng", icon: Store },
  { to: "/contact", label: "Liên hệ", icon: MessageCircle },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Điều hướng chính" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-0.5 rounded-full bg-cream-50/90 p-1.5 shadow-[0_18px_40px_-14px_rgba(42,24,16,0.55)] ring-1 ring-espresso-900/10 backdrop-blur-xl">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium transition-colors ${active ? "text-cream-50" : "text-espresso-700"}`}
            >
              {active && <motion.span layoutId="bottom-nav-active" className="absolute inset-0 rounded-full bg-espresso-900" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Icon size={19} className="relative" strokeWidth={active ? 2.3 : 1.9} />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
        <a
          href={CLIENT_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-0.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 py-1.5 text-[10px] font-semibold text-espresso-950"
        >
          <Download size={19} strokeWidth={2.2} />
          <span>Tải app</span>
        </a>
      </div>
    </nav>
  );
}
