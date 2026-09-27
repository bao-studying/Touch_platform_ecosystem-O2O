import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Settings2, Users, Store, Nfc, LogOut, Coffee, AlertTriangle, UserCircle, Clock, MessageSquareHeart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";
import api from "../../api/axios";

const NAV_ITEMS = [
  { to: "/admin", label: "Home", icon: Home, end: true },
  { to: "/admin/setup", label: "Setup", icon: Settings2 },
  { to: "/admin/crm", label: "CRM", icon: Users },
  { to: "/admin/store", label: "Store", icon: Store },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const { business, loading } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  useEffect(() => {
    if (!business) return;
    api
      .get(`/reviews/business/${business._id}`, { params: { channel: "internal" } })
      .then((res) => setNewFeedbackCount(res.data.filter((r) => r.status === "new").length))
      .catch(() => {});
  }, [business]);

  useEffect(() => {
    if (!loading && admin && !business) {
      navigate("/admin/onboarding");
    }
  }, [loading, admin, business, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-app-surface-soft text-espresso-700">Đang tải...</div>;
  }

  // Banner nhắc gia hạn khi còn ≤ 3 ngày là hết hạn gói trả phí
  let daysLeft = null;
  if (business?.planExpiresAt) {
    const diff = new Date(business.planExpiresAt) - new Date();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  const showExpiryWarning = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  return (
    <div className="min-h-screen min-h-dvh bg-app-surface md:flex">
      {/* Sidebar desktop */}
      <aside className="edge-accent-top hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-espresso-950 text-cream-100 px-4 py-6">
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="w-9 h-9 rounded-xl bg-amber-400 text-espresso-950 flex items-center justify-center">
            <Coffee size={18} />
          </span>
          <span className="font-display text-lg">O2O Brand</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive ? "bg-cream-50/10 text-cream-50" : "text-cream-100/60 hover:bg-cream-50/5"
                }`
              }
            >
              <Icon size={18} /> {label}
              {label === "Home" && newFeedbackCount > 0 && (
                <span className="ml-auto text-[10px] bg-clay-500 text-white rounded-full px-1.5 py-0.5">
                  {newFeedbackCount}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/admin/nfc"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? "bg-cream-50/10 text-cream-50" : "text-cream-100/60 hover:bg-cream-50/5"
              }`
            }
          >
            <Nfc size={18} /> Kích hoạt NFC
          </NavLink>
          <NavLink
            to="/admin/feedback"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? "bg-cream-50/10 text-cream-50" : "text-cream-100/60 hover:bg-cream-50/5"
              }`
            }
          >
            <MessageSquareHeart size={18} /> Góp ý khách hàng
          </NavLink>
          <NavLink
            to="/admin/account"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? "bg-cream-50/10 text-cream-50" : "text-cream-100/60 hover:bg-cream-50/5"
              }`
            }
          >
            <UserCircle size={18} /> Cài đặt tài khoản
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cream-100/50 hover:bg-cream-50/5">
          <LogOut size={18} /> Đăng xuất
        </button>
      </aside>

      {/* Nội dung chính */}
      <div className="flex-1 md:ml-60 pb-24 md:pb-8">
        {newFeedbackCount > 0 && (
          <div className="bg-clay-500/10 border-b border-clay-500/20 px-5 py-2.5 flex items-center gap-2 text-clay-500 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            Có {newFeedbackCount} góp ý nội bộ 1-3 sao mới cần xử lý.
          </div>
        )}
        {showExpiryWarning && (
          <button
            onClick={() => navigate("/admin/store")}
            className="w-full bg-amber-400/15 border-b border-amber-400/25 px-5 py-2.5 flex items-center gap-2 text-amber-700 text-sm text-left"
          >
            <Clock size={16} className="shrink-0" />
            Gói {business.plan.toUpperCase()} còn {daysLeft} ngày là hết hạn — bấm để gia hạn.
          </button>
        )}
        {/* key={pathname}: ép React remount khối này mỗi khi đổi tab, để animation "page-in"
            (mờ dần + trượt nhẹ lên) chạy lại từ đầu mỗi lần chuyển trang — hiệu ứng chuyển trang
            mượt mà hơn thay vì nội dung mới xuất hiện đột ngột. */}
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </div>

      {/* Bottom tab bar mobile — hiệu ứng "liquid glass" (kính mờ trong suốt kiểu Apple): nền bán
          trong suốt + backdrop-blur để thấy mờ mờ nội dung phía sau khi cuộn, viền sáng mép trên
          mô phỏng ánh sáng khúc xạ qua kính thật. LUÔN cố định đúng vị trí trong khung hiển thị,
          không ẩn/hiện hay di chuyển theo hướng cuộn (dù lướt lên hay xuống). */}
      <nav className="edge-accent-top glass-bar md:hidden fixed bottom-0 inset-x-0 z-30 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 items-center">
          {NAV_ITEMS.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="flex flex-col items-center gap-0.5 py-1.5">
              {({ isActive }) => (
                <>
                  <Icon size={20} className={isActive ? "text-espresso-900" : "text-espresso-900/40"} />
                  <span className={`text-[10px] ${isActive ? "text-espresso-900 font-medium" : "text-espresso-900/40"}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          <div className="flex justify-center">
            <button
              onClick={() => navigate("/admin/nfc")}
              className="relative -mt-7 w-14 h-14 rounded-full bg-espresso-800 text-cream-50 flex items-center justify-center shadow-lg shadow-espresso-900/30 animate-fab-pulse"
              aria-label="Quản lý chip NFC / QR"
            >
              <Nfc size={24} />
            </button>
          </div>

          {NAV_ITEMS.slice(2).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="flex flex-col items-center gap-0.5 py-1.5">
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} className={isActive ? "text-espresso-900" : "text-espresso-900/40"} />
                    {label === "Home" && newFeedbackCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-[8px] flex items-center justify-center bg-clay-500 text-white rounded-full">
                        {newFeedbackCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isActive ? "text-espresso-900 font-medium" : "text-espresso-900/40"}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
}
