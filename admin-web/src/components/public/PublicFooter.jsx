import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { CONTACT_INFO } from "../../lib/contactInfo";

export default function PublicFooter() {
  const [support, setSupport] = useState({ supportZalo: "", supportHotline: "" });

  useEffect(() => {
    api
      .get("/public/support-info")
      .then((res) => setSupport(res.data))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-espresso-950 text-cream-100">
      <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="font-display text-xl font-semibold text-cream-50 mb-3">O2O Brand</div>
          <p className="text-sm text-cream-200/70 leading-relaxed max-w-xs">
            Nền tảng SaaS biến mỗi vật phẩm decor trên bàn thành một điểm chạm quảng bá thương hiệu — chạm NFC hoặc
            quét QR là mở ngay trang thương hiệu của bạn.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-cream-50 mb-3">Liên kết</div>
          <ul className="space-y-2 text-sm text-cream-200/70">
            <li><Link to="/about" className="hover:text-cream-50">Giới thiệu</Link></li>
            <li><Link to="/store" className="hover:text-cream-50">Bảng giá & Cửa hàng</Link></li>
            <li><Link to="/contact" className="hover:text-cream-50">Liên hệ</Link></li>
            <li><Link to="/register" className="hover:text-cream-50">Đăng ký dùng thử</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-cream-50 mb-3">Hỗ trợ</div>
          <ul className="space-y-2 text-sm text-cream-200/70">
            <li>
              <a href={`mailto:${CONTACT_INFO.supportEmail}`} className="hover:text-cream-50">
                {CONTACT_INFO.supportEmail}
              </a>
            </li>
            <li>Hotline: {support.supportHotline || CONTACT_INFO.hotline}</li>
            <li>Zalo: {support.supportZalo || CONTACT_INFO.zalo}</li>
            <li>
              <Link to="/contact" className="hover:text-cream-50">Gửi tin nhắn qua trang Liên hệ</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-50/10 pb-[calc(1.25rem+var(--bottom-nav-h))] pt-5 text-center text-xs text-cream-200/50">
        © {new Date().getFullYear()} O2O Brand Promotion & Customer Capture.
      </div>
    </footer>
  );
}
