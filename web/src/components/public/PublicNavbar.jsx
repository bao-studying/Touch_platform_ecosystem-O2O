import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/about", label: "Giới thiệu" },
  { to: "/store", label: "Bảng giá & Cửa hàng" },
  { to: "/contact", label: "Liên hệ" },
];

const CLIENT_WEB_URL = import.meta.env.VITE_CLIENT_WEB_URL || "http://localhost:5173";

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  // Đã đăng nhập → đưa thẳng sang Dashboard thật ở Client Web (kèm token dùng chung 1 lần, tự dọn khỏi URL).
  const dashboardUrl = `${CLIENT_WEB_URL}/admin?token=${localStorage.getItem("o2o_token") || ""}`;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-cream-50/95 backdrop-blur border-b border-cream-200">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-semibold text-espresso-900">
          O2O <span className="text-clay-500">Brand</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to ? "text-clay-500" : "text-espresso-700 hover:text-espresso-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {admin ? (
            <>
              <a
                href={dashboardUrl}
                className="flex items-center gap-1.5 text-sm font-medium bg-espresso-900 text-cream-50 px-4 py-2 rounded-full hover:bg-espresso-800 transition-colors"
              >
                <LayoutDashboard size={14} /> Vào Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-espresso-700 hover:text-clay-500 px-3 py-2 rounded-full transition-colors"
              >
                <LogOut size={14} /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-espresso-700 hover:text-espresso-900">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-espresso-900 text-cream-50 px-4 py-2 rounded-full hover:bg-espresso-800 transition-colors"
              >
                Bắt đầu miễn phí
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-espresso-900" onClick={() => setOpen((v) => !v)} aria-label="Mở menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-cream-200 bg-cream-50 px-5 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-espresso-800 font-medium">
              {link.label}
            </Link>
          ))}
          <div className="border-t border-cream-200 pt-4 flex flex-col gap-3">
            {admin ? (
              <>
                <a href={dashboardUrl} className="text-center bg-espresso-900 text-cream-50 px-4 py-2.5 rounded-full font-medium">
                  Vào Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 text-espresso-700 font-medium py-1"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-espresso-700 font-medium">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="text-center bg-espresso-900 text-cream-50 px-4 py-2.5 rounded-full font-medium"
                >
                  Bắt đầu miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
