import { Smartphone, Mail, ArrowRight } from "lucide-react";

const CLIENT_WEB_URL = import.meta.env.VITE_CLIENT_WEB_URL || "http://localhost:5173";

// Trang đích sau khi đăng ký thành công. Phiên bản demo — placeholder theo đúng yêu cầu, phần liên kết
// App Store / Google Play thật sẽ hoàn thiện ở round publish app sau này (Capacitor).
//
// "Tiếp tục thiết lập" trỏ SANG Client Web thật (repo Touch-app) kèm ?token= — vì Dashboard/Onboarding
// không còn nằm trong app này nữa. Token ký bằng JWT_SECRET chung nên Client Web dùng thẳng được luôn.
export default function DownloadApp() {
  const token = localStorage.getItem("o2o_token");
  const continueUrl = `${CLIENT_WEB_URL}/admin/onboarding${token ? `?token=${token}` : ""}`;

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-espresso-900 text-cream-50 flex items-center justify-center mx-auto">
          <Smartphone size={28} />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-espresso-950 mt-6">
          Tài khoản đã được tạo!
        </h1>
        <p className="mt-3 text-espresso-700 leading-relaxed">
          Ứng dụng quản lý O2O Brand cho điện thoại đang được hoàn thiện. Trong lúc chờ, bạn có thể bắt đầu thiết lập
          trang thương hiệu ngay trên trình duyệt.
        </p>

        <div className="mt-6 flex items-center gap-2 justify-center text-sm text-espresso-600 bg-cream-100 rounded-full px-4 py-2 w-fit mx-auto">
          <Mail size={14} />
          Đừng quên xác thực email để mở khóa đầy đủ tài khoản
        </div>

        <a
          href={continueUrl}
          className="mt-8 inline-flex items-center gap-2 bg-espresso-900 text-cream-50 px-6 py-3 rounded-full font-medium hover:bg-espresso-800 transition-colors"
        >
          Tiếp tục thiết lập trên web <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
