import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SuperAdminAuthProvider, useSuperAdminAuth } from "./context/SuperAdminAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

import PublicLayout from "./components/public/PublicLayout";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Store from "./pages/public/Store";
import Contact from "./pages/public/Contact";
import DownloadApp from "./pages/public/DownloadApp";
import VerifyEmail from "./pages/public/VerifyEmail";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import SuperAdminLogin from "./pages/superadmin/SuperAdminLogin";
import SuperAdminLayout from "./components/superadmin/SuperAdminLayout";
import Overview from "./pages/superadmin/Overview";
import Tenants from "./pages/superadmin/Tenants";
import Plans from "./pages/superadmin/Plans";
import Orders from "./pages/superadmin/Orders";
import Tickets from "./pages/superadmin/Tickets";
import Cms from "./pages/superadmin/Cms";
import Settings from "./pages/superadmin/Settings";

function RequireSuperAdmin({ children }) {
  const { superAdmin, loading } = useSuperAdminAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-ink-950 text-white">Đang tải...</div>;
  if (!superAdmin) return <Navigate to="/super-admin/login" replace />;
  return children;
}

function SuperAdminArea() {
  return (
    <Routes>
      {/* URL này không được link công khai ở đâu — vào bằng cách biết thẳng URL, hoặc qua trang /login (đăng nhập thường) khi tài khoản là Super Admin */}
      <Route path="login" element={<SuperAdminLogin />} />
      <Route
        element={
          <RequireSuperAdmin>
            <SuperAdminLayout />
          </RequireSuperAdmin>
        }
      >
        <Route path="dashboard" element={<Overview />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="plans" element={<Plans />} />
        <Route path="orders" element={<Orders />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="cms" element={<Cms />} />
        <Route path="settings" element={<Settings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SuperAdminAuthProvider>
            <Routes>
              {/* SaaS Landing Page công khai — dành cho khách hàng doanh nghiệp tiềm năng */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/store" element={<Store />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              <Route path="/download" element={<DownloadApp />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Super Admin — khu vực nội bộ chủ nền tảng */}
              <Route path="/super-admin/*" element={<SuperAdminArea />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SuperAdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
