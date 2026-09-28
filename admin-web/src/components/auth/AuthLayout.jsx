import { ToastProvider } from "../superadmin/Toast";
import AuthSidePanel from "./AuthSidePanel";
import BackHomeButton from "./BackHomeButton";

// Khung dùng chung cho Login/Register của admin-web — bố cục 2 cột y hệt client-web
// (form trái / panel thương hiệu phải, mobile 1 cột nền tối), cộng thêm nút "Quay lại trang chủ".
export default function AuthLayout({ children, widthClass = "max-w-sm" }) {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-auth-surface lg:grid lg:grid-cols-2">
        <div className="absolute left-5 top-5 z-20 sm:left-8 sm:top-7 lg:left-10">
          <BackHomeButton />
        </div>

        <div className="flex min-h-screen flex-col justify-center px-6 pb-12 pt-24 sm:px-10 lg:min-h-0 lg:px-16 lg:pt-12 xl:px-20">
          <div className={`mx-auto w-full animate-fade-in ${widthClass}`}>{children}</div>
        </div>

        <AuthSidePanel />
      </div>
    </ToastProvider>
  );
}
