import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Nfc, ScanLine, Star, Users2, Coffee, UtensilsCrossed, Sparkles, Store as StoreIcon } from "lucide-react";
import api from "../../api/axios";
import { socket } from "../../lib/socket";

const USE_CASE_ICONS = [Coffee, UtensilsCrossed, Sparkles, StoreIcon];
const USE_CASE_DEFAULTS = [
  { title: "Quán cà phê", desc: "Khách chạm vào mascot trên bàn để đánh giá 5 sao và nhận ưu đãi lần sau." },
  { title: "Nhà hàng", desc: "Gắn chip lên standee quầy thu ngân, thu thập khách hàng thân thiết mỗi lượt ghé." },
  { title: "Spa & làm đẹp", desc: "Biến mỗi lượt khách ghé thành một đánh giá thật và một lượt theo dõi mạng xã hội." },
  { title: "Cửa hàng bán lẻ", desc: "Một điểm chạm duy nhất dẫn tới mọi kênh: Shopee, mạng xã hội, ưu đãi thành viên." },
];

export default function Home() {
  const [cms, setCms] = useState({});

  useEffect(() => {
    const load = () => api.get("/public/cms").then((res) => setCms(res.data)).catch(() => {});
    load();
    socket.on("cms:updated", load);
    return () => socket.off("cms:updated", load);
  }, []);

  const hero = cms.hero || {};
  const usecases = cms.usecases || {};

  return (
    // Mỗi section bên dưới là 1 "slide" cao bằng màn hình (trừ chiều cao navbar 4rem/h-16), scroll-snap
    // bắt dính từng slide khi lướt (chuột, trackpad hoặc vuốt cảm ứng) — hiệu ứng "lướt trang" kiểu slide to slide.
    <div className="snap-y snap-mandatory overflow-y-auto h-[calc(100vh-4rem)] scroll-smooth">
      {/* Hero */}
      <section className="snap-start snap-always min-h-[calc(100vh-4rem)] flex items-center">
        <div className="w-full max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-espresso-950 leading-[1.1]">
              {hero.title || "Biến mỗi vật decor trên bàn thành một kênh quảng bá thương hiệu"}
            </h1>
            {hero.bodyHtml && (
              <div
                className="mt-5 text-espresso-700 text-lg leading-relaxed max-w-md [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: hero.bodyHtml }}
              />
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={hero.ctaLink || "/register"}
                className="bg-espresso-900 text-cream-50 px-7 py-3.5 rounded-full font-medium hover:bg-espresso-800 transition-colors"
              >
                {hero.ctaLabel || "Bắt đầu miễn phí ngay"}
              </Link>
              <Link to="/store" className="text-espresso-800 font-medium underline underline-offset-4 decoration-clay-500/50">
                Xem bảng giá & sản phẩm
              </Link>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      {/* Cách hoạt động — đây thực sự là 1 chuỗi thao tác tuần tự nên dùng số bước là hợp lý */}
      <section className="snap-start snap-always min-h-[calc(100vh-4rem)] flex items-center bg-cream-100 border-y border-cream-200">
        <div className="w-full max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-3 gap-10">
          {[
            { icon: Nfc, step: "1", title: "Chạm hoặc quét", desc: "Khách chạm điện thoại vào chip NFC gắn trên vật decor, hoặc quét mã QR đi kèm." },
            { icon: ScanLine, step: "2", title: "Trang thương hiệu mở ra", desc: "Landing Page của bạn hiện ra ngay lập tức — không cần cài app." },
            { icon: Star, step: "3", title: "Chuyển đổi thành khách quen", desc: "Khách để lại đánh giá 5 sao, theo dõi mạng xã hội, hoặc đăng ký thành viên thân thiết." },
          ].map((s) => (
            <div key={s.step}>
              <div className="w-11 h-11 rounded-full bg-espresso-900 text-cream-50 flex items-center justify-center font-display font-semibold">
                {s.step}
              </div>
              <h3 className="font-display text-xl font-semibold text-espresso-950 mt-4">{s.title}</h3>
              <p className="text-espresso-700 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="snap-start snap-always min-h-[calc(100vh-4rem)] flex items-center">
        <div className="w-full max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-display text-3xl font-semibold text-espresso-950 max-w-xl">
            {usecases.title || "Phù hợp với mọi mô hình Online-to-Offline"}
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {USE_CASE_DEFAULTS.map((uc, i) => {
              const Icon = USE_CASE_ICONS[i];
              return (
                <div key={uc.title} className="bg-white rounded-2xl border border-cream-200 p-6">
                  <Icon className="text-clay-500" size={26} />
                  <h3 className="font-display text-lg font-semibold text-espresso-950 mt-4">{uc.title}</h3>
                  <p className="text-sm text-espresso-700 mt-2 leading-relaxed">{uc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="snap-start snap-always min-h-[calc(100vh-4rem)] flex items-center">
        <div className="w-full max-w-6xl mx-auto px-5 py-16">
          <div className="bg-espresso-950 rounded-3xl px-8 py-14 md:py-16 text-center">
            <Users2 className="mx-auto text-amber-400" size={32} />
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream-50 mt-4 max-w-xl mx-auto">
              Sẵn sàng biến mỗi lượt khách ghé thành một khách hàng thân thiết?
            </h2>
            <Link
              to="/register"
              className="inline-block mt-7 bg-cream-50 text-espresso-950 px-7 py-3.5 rounded-full font-medium hover:bg-cream-100 transition-colors"
            >
              Bắt đầu miễn phí ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 380" className="w-full max-w-md mx-auto" role="img" aria-label="Minh họa chip NFC và mã QR gắn trên vật decor">
      <circle cx="210" cy="190" r="170" fill="#EBDCC0" opacity="0.5" />
      <rect x="95" y="120" width="180" height="220" rx="24" fill="#FBF6EE" stroke="#EBDCC0" strokeWidth="2" />
      <rect x="120" y="150" width="60" height="60" rx="6" fill="#4A2E1F" />
      {[[128, 158], [128, 172], [142, 158]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="10" height="10" fill="#FBF6EE" />
      ))}
      <rect x="120" y="230" width="130" height="10" rx="5" fill="#EBDCC0" />
      <rect x="120" y="250" width="90" height="10" rx="5" fill="#EBDCC0" />
      <circle cx="290" cy="130" r="42" fill="#C08A2E" />
      <path d="M275 130a15 15 0 0 1 30 0" stroke="#FBF6EE" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M268 130a22 22 0 0 1 44 0" stroke="#FBF6EE" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="290" cy="140" r="4" fill="#FBF6EE" />
      <circle cx="120" cy="90" r="6" fill="#B8562F" />
      <circle cx="320" cy="260" r="8" fill="#8FA382" />
    </svg>
  );
}
