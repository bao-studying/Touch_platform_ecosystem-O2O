import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";
import { ToastProvider } from "./context/ToastContext";

import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/admin/Onboarding";
import AdminLayout from "./components/admin/AdminLayout";
import Home from "./pages/admin/Home";
import Setup from "./pages/admin/Setup";
import Nfc from "./pages/admin/Nfc";
import Crm from "./pages/admin/Crm";
import Store from "./pages/admin/Store";
import Feedback from "./pages/admin/Feedback";
import AccountSettings from "./pages/admin/AccountSettings";

function RequireAuth({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream-50 text-espresso-700">Đang tải...</div>;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

function AdminArea() {
  const location = useLocation();
  // Pattern "modal route": khi mở /admin/account từ avatar mobile, ta điều hướng kèm
  // state={{ backgroundLocation }} — trang phía sau (Home) vẫn được render bình thường theo
  // backgroundLocation, còn AccountSettings render CHỒNG LÊN dưới dạng overlay trượt vào từ phải.
  // Nếu vào thẳng URL /admin/account (không có state) thì vẫn hoạt động như 1 trang bình thường.
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <RequireAuth>
      <BusinessProvider>
        <Routes location={backgroundLocation || location}>
          <Route path="onboarding" element={<Onboarding />} />
          <Route element={<AdminLayout />}>
            <Route index element={<Home />} />
            <Route path="setup" element={<Setup />} />
            <Route path="nfc" element={<Nfc />} />
            <Route path="crm" element={<Crm />} />
            <Route path="store" element={<Store />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="account" element={<AccountSettings />} />
          </Route>
        </Routes>

        {backgroundLocation && (
          <Routes>
            <Route path="account" element={<AccountSettings overlay />} />
          </Routes>
        )}
      </BusinessProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Landing Page công khai — khách chạm NFC / quét QR sẽ vào đây */}
            <Route path="/p/:slug" element={<LandingPage />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Dashboard (mobile + desktop, cùng 1 bộ route responsive) */}
            <Route path="/admin/*" element={<AdminArea />} />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
