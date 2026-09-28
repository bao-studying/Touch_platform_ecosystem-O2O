import { Coffee, Nfc, Users, Palette } from "lucide-react";
import MascotIllustration from "../common/MascotIllustration";

// 3 điểm mạnh thật của sản phẩm (không phải số liệu bịa) — dùng để tạo lòng tin trên panel bên
// phải, giống bố cục "ảnh/minh hoạ lớn bên phải" của các trang Auth tham khảo.
const HIGHLIGHTS = [
  { icon: Nfc, text: "Khách chạm NFC hoặc quét QR là mở ngay trang thương hiệu" },
  { icon: Users, text: "Thu thập khách hàng thân thiết & quản lý CRM ngay trên điện thoại" },
  { icon: Palette, text: "Tuỳ biến màu sắc, kiểu chữ, hiệu ứng theo đúng phong cách quán" },
];

// Panel trang trí bên phải cho Login/Register — CHỈ hiện ở desktop (lg trở lên). Trên mobile ẩn
// hoàn toàn để nhường toàn bộ màn hình cho form, đúng như bố cục ảnh tham khảo (mobile: 1 cột;
// desktop: chia đôi màn hình, bên phải là hình minh hoạ/thương hiệu).
export default function AuthSidePanel() {
  return (
    <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-auth-surface-panel px-12 py-14 xl:px-16">
      {/* Vòng cung chấm bi trang trí — gợi liên tưởng sóng kết nối NFC/QR */}
      <svg
        className="pointer-events-none absolute -right-28 -top-28 opacity-50"
        width="440"
        height="440"
        viewBox="0 0 440 440"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="220" cy="220" r="190" stroke="#D4A24C" strokeWidth="1.5" strokeDasharray="2 11" strokeLinecap="round" />
        <circle cx="220" cy="220" r="140" stroke="#8FA382" strokeWidth="1.5" strokeDasharray="2 11" strokeLinecap="round" />
      </svg>

      <div className="relative flex items-center gap-2.5">
        <span className="w-10 h-10 rounded-xl bg-cream-50/10 ring-1 ring-cream-50/15 text-cream-50 flex items-center justify-center">
          <Coffee size={19} />
        </span>
        <span className="font-display text-lg text-cream-50">O2O Brand</span>
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="w-40 h-40 rounded-full bg-cream-50/[0.06] ring-1 ring-cream-50/10 flex items-center justify-center mb-8">
          <MascotIllustration mood="wave" size={92} />
        </div>
        <p className="font-display text-2xl text-cream-50 leading-snug max-w-xs">
          Biến mỗi lượt chạm thành một khách hàng thân thiết.
        </p>
      </div>

      <div className="relative space-y-4">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-cream-50/10 flex items-center justify-center text-amber-400">
              <Icon size={15} />
            </span>
            <p className="text-sm text-cream-100/80 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
