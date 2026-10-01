import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Heart, Nfc, Star } from "lucide-react";
import api from "../../api/axios";
import { socket } from "../../lib/socket";
import MascotIllustration from "../../components/common/MascotIllustration";
import { DepthLayer, TiltCard, usePointerDepth } from "../../components/public/fx";
import { CafeArt, DinnerArt, RetailArt, SpaArt } from "../../components/public/illustrations";

const SECTIONS = [
  { id: "hero", label: "Mở đầu" },
  { id: "story", label: "Cách hoạt động" },
  { id: "usecases", label: "Mô hình phù hợp" },
  { id: "cta", label: "Bắt đầu" },
];

const STEPS = [
  { title: "Chạm hoặc quét", desc: "Khách chạm điện thoại vào chip NFC gắn trên vật decor, hoặc quét mã QR đi kèm." },
  { title: "Trang thương hiệu mở ra", desc: "Landing Page của bạn hiện ra ngay lập tức — không cần cài app." },
  { title: "Chuyển đổi thành khách quen", desc: "Khách để lại đánh giá 5 sao, theo dõi mạng xã hội, hoặc đăng ký thành viên thân thiết." },
];

const CASES = [
  {
    title: "Quán cà phê",
    desc: "Khách chạm vào mascot trên bàn để đánh giá 5 sao và nhận ưu đãi lần sau.",
    Art: CafeArt,
    span: "lg:col-span-7",
    tone: "bg-espresso-900 text-cream-50",
    sub: "text-cream-100/70",
    spot: "rgba(212,162,76,0.25)",
  },
  {
    title: "Nhà hàng",
    desc: "Gắn chip lên standee quầy thu ngân, thu thập khách hàng thân thiết mỗi lượt ghé.",
    Art: DinnerArt,
    span: "lg:col-span-5",
    tone: "bg-cream-100 text-espresso-950 ring-1 ring-cream-200",
    sub: "text-espresso-700",
    spot: "rgba(184,86,47,0.16)",
  },
  {
    title: "Spa & làm đẹp",
    desc: "Biến mỗi lượt khách ghé thành một đánh giá thật và một lượt theo dõi mạng xã hội.",
    Art: SpaArt,
    span: "lg:col-span-5",
    tone: "bg-[#E3EADB] text-espresso-950 ring-1 ring-sage-400/30",
    sub: "text-espresso-700",
    spot: "rgba(113,136,106,0.25)",
  },
  {
    title: "Cửa hàng bán lẻ",
    desc: "Một điểm chạm duy nhất dẫn tới mọi kênh: Shopee, mạng xã hội, ưu đãi thành viên.",
    Art: RetailArt,
    span: "lg:col-span-7",
    tone: "bg-[#F3DFB5] text-espresso-950 ring-1 ring-amber-400/30",
    sub: "text-espresso-700",
    spot: "rgba(255,255,255,0.45)",
  },
];

export default function Home() {
  const [cms, setCms] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () =>
      api
        .get("/public/cms")
        .then((res) => setCms(res.data))
        .catch(() => {})
        .finally(() => setLoaded(true));
    load();
    socket.on("cms:updated", load);
    return () => socket.off("cms:updated", load);
  }, []);

  return (
    <div>
      <SectionRail />
      <Hero hero={cms.hero || {}} loaded={loaded} />
      <Story />
      <UseCases title={cms.usecases?.title} />
      <FinalCta />
    </div>
  );
}

/* ---------------------------------------------------------------- Thanh mục lục bên phải */
function SectionRail() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Các phần của trang"
      className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-full bg-espresso-950/75 p-2 ring-1 ring-cream-50/10 backdrop-blur-md lg:flex"
    >
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
          aria-label={s.label}
          className="group relative flex h-6 w-4 items-center justify-center"
        >
          <span
            className={`block w-1.5 rounded-full transition-all duration-300 ${
              active === s.id ? "h-5 bg-amber-400" : "h-1.5 bg-cream-50/40 group-hover:bg-cream-50"
            }`}
          />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-espresso-950 px-2.5 py-1 text-xs text-cream-50 opacity-0 transition-opacity group-hover:opacity-100">
            {s.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------- Khung điện thoại (thiết kế 220×450, tự co theo bề rộng) */
function Phone({ children, className = "" }) {
  const ref = useRef(null);
  const [k, setK] = useState(0.8);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / 220));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative aspect-[220/450] ${className}`}>
      <div
        style={{ width: 220, height: 450, transform: `scale(${k})`, transformOrigin: "top left" }}
        className="absolute left-0 top-0 rounded-[34px] bg-espresso-950 p-[7px] shadow-[0_34px_60px_-24px_rgba(0,0,0,0.6)] ring-1 ring-cream-50/20"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-cream-50">
          <div className="absolute left-1/2 top-2 z-20 h-[13px] w-[52px] -translate-x-1/2 rounded-full bg-espresso-950" />
          {children}
        </div>
      </div>
    </div>
  );
}

function BrandScreen({ imageUrl }) {
  return (
    <div className="h-full w-full bg-cream-50">
      <div className="h-[150px] bg-gradient-to-br from-amber-400 via-amber-500 to-clay-500">
        {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="-mt-9 flex flex-col items-center px-4 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-espresso-800 ring-4 ring-cream-50">
          <MascotIllustration size={54} />
        </div>
        <div className="mt-2 font-display text-[15px] font-semibold text-espresso-950">Quán của bạn</div>
        <div className="text-[10px] text-espresso-600">Chạm để nhận ưu đãi</div>
        <div className="mt-2 flex gap-0.5 text-amber-500">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={13} fill="currentColor" />
          ))}
        </div>
        <div className="mt-4 w-full space-y-2 text-[11px] font-medium">
          <div className="rounded-full bg-espresso-900 py-2 text-cream-50">Đánh giá 5 sao</div>
          <div className="rounded-full bg-cream-200 py-2 text-espresso-900">Theo dõi Instagram</div>
          <div className="rounded-full bg-cream-200 py-2 text-espresso-900">Đăng ký thành viên</div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-espresso-900 shadow-[0_14px_30px_-14px_rgba(42,24,16,0.5)] ring-1 ring-espresso-900/5 backdrop-blur">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/25 text-amber-600">
        <Icon size={14} fill="currentColor" />
      </span>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Hero */
function Hero({ hero, loaded }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const { sx, sy, onPointerMove } = usePointerDepth();
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const title = hero.title || "Biến mỗi vật decor trên bàn thành một kênh quảng bá thương hiệu";

  return (
    <section id="hero" ref={ref} onPointerMove={onPointerMove} className="relative scroll-mt-16 overflow-x-clip bg-paper-dots">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-6 h-[420px] w-[420px] rounded-full bg-amber-400/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-sage-400/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-8">
        <motion.div style={{ y: textY }}>
          <h1 className="font-display text-[2.55rem] font-semibold leading-[1.06] tracking-[-0.02em] text-espresso-950 sm:text-6xl">
            {title.split(" ").map((w, i) => (
              <span key={`${i}-${w}`} className="mr-[0.24em] inline-block overflow-hidden py-[0.16em] -my-[0.16em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={reduce ? false : { y: "115%" }}
                  animate={{ y: loaded ? 0 : "115%" }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : i * 0.05 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>

          {hero.bodyHtml && (
            <div
              className="mt-6 max-w-md text-lg leading-relaxed text-espresso-700 [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: hero.bodyHtml }}
            />
          )}

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              to={hero.ctaLink || "/register"}
              className="group inline-flex items-center gap-2 rounded-full bg-espresso-900 px-7 py-3.5 font-medium text-cream-50 shadow-[0_18px_34px_-14px_rgba(42,24,16,0.7)] transition-all hover:bg-espresso-800 hover:shadow-[0_22px_40px_-14px_rgba(42,24,16,0.8)]"
            >
              {hero.ctaLabel || "Bắt đầu miễn phí ngay"}
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/store" className="font-medium text-espresso-800 underline decoration-clay-500/50 underline-offset-4 hover:decoration-clay-500">
              Xem bảng giá & sản phẩm
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-espresso-700">
            {["Không cần cài app", "Chạm NFC hoặc quét QR", "Dùng thử miễn phí"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check size={15} className="text-sage-500" /> {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <HeroScene sx={sx} sy={sy} scroll={scrollYProgress} reduce={reduce} imageUrl={hero.imageUrl} />
      </div>
    </section>
  );
}

// Cảnh "chiếc bàn" nhiều lớp: mỗi lớp trôi theo con trỏ và theo cuộn với tốc độ khác nhau → có chiều sâu thật.
function HeroScene({ sx, sy, scroll, reduce, imageUrl }) {
  const L = { sx, sy, scroll, reduce };
  return (
    <div className="relative mx-auto h-[340px] w-[340px] sm:h-[460px] sm:w-[460px]">
      <div className="absolute left-0 top-0 h-[460px] w-[460px] origin-top-left scale-[0.74] sm:scale-100">
        <DepthLayer depth={0.25} {...L} className="absolute inset-0">
          <svg viewBox="0 0 460 460" className="h-full w-full" aria-hidden="true">
            <circle cx="230" cy="230" r="212" fill="#EBDCC0" opacity="0.45" />
            <circle cx="230" cy="230" r="196" fill="none" stroke="#D4A24C" strokeWidth="1.5" strokeDasharray="2 11" strokeLinecap="round" />
            <circle cx="230" cy="230" r="146" fill="none" stroke="#8FA382" strokeWidth="1.5" strokeDasharray="2 11" strokeLinecap="round" />
          </svg>
        </DepthLayer>

        {/* Vật decor trên bàn: đế tròn + linh vật, sóng NFC lan ra */}
        <DepthLayer depth={0.7} {...L} className="absolute left-[4%] top-[38%] aspect-square w-[54%]">
          <div className="absolute inset-[6%] rounded-full bg-espresso-950/25 blur-xl" />
          {[0, 0.9, 1.8].map((d) => (
            <span key={d} style={{ animationDelay: `${d}s` }} className="animate-ripple absolute inset-0 rounded-full border border-amber-400/70" />
          ))}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-b from-espresso-600 to-espresso-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.15),0_24px_40px_-18px_rgba(42,24,16,0.7)] ring-8 ring-cream-200/70">
            <MascotIllustration size="66%" mood="wave" />
          </div>
        </DepthLayer>

        <DepthLayer depth={1.25} {...L} className="absolute right-[3%] top-[4%] w-[44%]">
          <div className="rotate-[7deg] animate-float">
            <Phone>
              <BrandScreen imageUrl={imageUrl} />
            </Phone>
          </div>
        </DepthLayer>

        <DepthLayer depth={1.8} {...L} className="absolute left-[0%] top-[16%]">
          <Chip icon={Star}>Đánh giá 5 sao</Chip>
        </DepthLayer>
        <DepthLayer depth={1.5} {...L} className="absolute bottom-[7%] right-[8%]">
          <Chip icon={Heart}>Ưu đãi lần sau</Chip>
        </DepthLayer>
        <DepthLayer depth={2} {...L} className="absolute bottom-[30%] right-[42%]">
          <div className="-rotate-6 rounded-2xl bg-white p-2.5 shadow-[0_16px_30px_-14px_rgba(42,24,16,0.5)] ring-1 ring-espresso-900/5">
            <svg viewBox="0 0 7 7" width="46" height="46" aria-hidden="true">
              {"1111111 1000001 1011101 1011101 1011101 1000001 1111111"
                .split(" ")
                .flatMap((row, y) => row.split("").map((c, x) => (c === "1" ? <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill="#3B2318" /> : null)))}
            </svg>
          </div>
        </DepthLayer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Câu chuyện "chạm → mở → khách quen" (ghim khi cuộn) */
// Lưu ý layout: StoryStage dùng h-full nên cột chứa nó PHẢI có chiều cao xác định. Ở desktop cột này được kéo giãn
// (self-stretch) — nếu đổi thành items-center thì chiều cao về auto, khung (toàn phần tử absolute) co về 0×0 và mất animation.
function Story() {
  const reduce = useReducedMotion();
  return reduce ? <StoryStatic /> : <StoryPinned />;
}

const CAPTION_RANGES = [
  { at: [0, 0.27, 0.33], o: [1, 1, 0], y: [0, 0, -26] },
  { at: [0.31, 0.37, 0.6, 0.66], o: [0, 1, 1, 0], y: [26, 0, 0, -26] },
  { at: [0.64, 0.7, 1], o: [0, 1, 1], y: [26, 0, 0] },
];

function StoryPinned() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 64px", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.0005 });

  return (
    <section id="story" ref={ref} className="relative h-[320vh] scroll-mt-16 bg-stage-dark">
      <div className="sticky top-16 flex h-[calc(100svh-4rem-var(--bottom-nav-h))] items-center overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-rows-[minmax(0,1fr)_auto] gap-2 px-5 py-4 lg:grid-cols-2 lg:grid-rows-1 lg:gap-14 lg:py-0">
          <div className="order-2 lg:order-1 lg:self-center">
            <h2 className="font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.01em] text-cream-50 sm:text-4xl lg:text-5xl">
              Từ một cú chạm đến một khách quen
            </h2>
            <div className="relative mt-3 h-[6.75rem] sm:h-28 lg:mt-8 lg:h-40">
              {STEPS.map((s, i) => (
                <StepCaption key={s.title} p={p} range={CAPTION_RANGES[i]} step={s} />
              ))}
            </div>
            <div className="mt-2 flex max-w-sm gap-2 lg:mt-6">
              {STEPS.map((s, i) => (
                <ProgressSeg key={s.title} p={p} i={i} />
              ))}
            </div>
          </div>

          <div className="order-1 flex min-h-0 items-center justify-center lg:order-2 lg:self-stretch lg:py-6">
            <StoryStage p={p} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCaption({ p, range, step }) {
  const opacity = useTransform(p, range.at, range.o);
  const y = useTransform(p, range.at, range.y);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0">
      <div className="text-lg font-semibold text-amber-400 lg:text-2xl">{step.title}</div>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-cream-100/75 sm:text-base">{step.desc}</p>
    </motion.div>
  );
}

function ProgressSeg({ p, i }) {
  const scaleX = useTransform(p, [i / 3, (i + 1) / 3], [0, 1]);
  return (
    <div className="h-1 flex-1 overflow-hidden rounded-full bg-cream-50/15">
      <motion.div style={{ scaleX }} className="h-full origin-left rounded-full bg-amber-400" />
    </div>
  );
}

function StoryStage({ p }) {
  // Điện thoại tiến lại đế NFC (0→0.3), chạm, rồi nổi lên giữa sân khấu để xem trang thương hiệu (0.3→0.45).
  const phoneX = useTransform(p, [0, 0.3, 0.45], ["120%", "45%", "0%"]);
  const phoneY = useTransform(p, [0, 0.3, 0.45], ["-6%", "6%", "0%"]);
  const phoneRot = useTransform(p, [0, 0.3, 0.45], [18, 8, 0]);
  const phoneScale = useTransform(p, [0, 0.3, 0.45], [0.92, 1, 1.05]);
  const coasterScale = useTransform(p, [0.3, 0.5], [1, 0.84]);
  const coasterOpacity = useTransform(p, [0.3, 0.5], [1, 0.3]);
  const coasterY = useTransform(p, [0.3, 0.5], ["0%", "8%"]);
  const rippleOpacity = useTransform(p, [0, 0.06, 0.3, 0.36], [0, 1, 1, 0]);
  const screenA = useTransform(p, [0.3, 0.36], [1, 0]);
  const screenB = useTransform(p, [0.3, 0.36, 0.62, 0.68], [0, 1, 1, 0]);
  const screenC = useTransform(p, [0.62, 0.68], [0, 1]);

  return (
    <div className="relative aspect-[4/5] h-full max-h-[540px]">
      <div aria-hidden="true" className="absolute inset-[6%] rounded-full border border-cream-50/10" />
      <div aria-hidden="true" className="absolute inset-[16%] rounded-full border border-dashed border-amber-400/30" />

      <motion.div style={{ scale: coasterScale, opacity: coasterOpacity, y: coasterY }} className="absolute left-[4%] top-[46%] aspect-square w-[58%]">
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-b from-espresso-600 to-espresso-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.14),0_30px_50px_-20px_rgba(0,0,0,0.8)] ring-8 ring-cream-50/10">
          <MascotIllustration size="62%" />
        </div>
      </motion.div>

      <motion.div style={{ opacity: rippleOpacity }} className="pointer-events-none absolute left-[38%] top-[44%] aspect-square w-[24%]">
        {[0, 0.9, 1.8].map((d) => (
          <span key={d} style={{ animationDelay: `${d}s` }} className="animate-ripple absolute inset-0 rounded-full border-2 border-amber-400/80" />
        ))}
        <span className="absolute inset-[38%] rounded-full bg-amber-400" />
      </motion.div>

      <motion.div
        style={{ x: phoneX, y: phoneY, rotate: phoneRot, scale: phoneScale }}
        className="absolute left-[28%] top-[6%] w-[44%]"
      >
        <Phone>
          <motion.div style={{ opacity: screenA }} className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-espresso-800 to-espresso-950 text-cream-50">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cream-50/10">
              <span className="animate-ripple absolute inset-0 rounded-full border border-amber-400/70" />
              <Nfc size={26} className="text-amber-400" />
            </span>
            <div className="mt-4 text-[11px] text-cream-100/70">Đang đọc thẻ NFC…</div>
          </motion.div>
          <motion.div style={{ opacity: screenB }} className="absolute inset-0">
            <BrandScreen />
          </motion.div>
          <motion.div style={{ opacity: screenC }} className="absolute inset-0">
            <ReviewScreen p={p} />
          </motion.div>
        </Phone>
      </motion.div>
    </div>
  );
}

function FillStar({ p, at }) {
  const opacity = useTransform(p, [at, at + 0.03], [0, 1]);
  const scale = useTransform(p, [at, at + 0.02, at + 0.05], [0.4, 1.3, 1]);
  return (
    <span className="relative block h-[22px] w-[22px]">
      <Star size={22} className="absolute inset-0 text-cream-200" fill="currentColor" />
      <motion.span style={{ opacity, scale }} className="absolute inset-0 text-amber-500">
        <Star size={22} fill="currentColor" />
      </motion.span>
    </span>
  );
}

function Stamp({ p, state }) {
  const fill = useTransform(p, [0.86, 0.9], [0, 1]);
  const base = "flex h-8 w-8 items-center justify-center rounded-full border";
  if (state === "on") return <span className={`${base} border-amber-500 bg-amber-400 text-espresso-950`}><Check size={14} strokeWidth={3} /></span>;
  if (state === "new")
    return (
      <span className={`${base} relative border-amber-500/60 text-espresso-950`}>
        <motion.span style={{ opacity: fill }} className="absolute inset-0 flex items-center justify-center rounded-full bg-amber-400">
          <Check size={14} strokeWidth={3} />
        </motion.span>
      </span>
    );
  return <span className={`${base} border-dashed border-espresso-900/25`} />;
}

function ReviewScreen({ p }) {
  const followed = useTransform(p, [0.92, 0.97], [0, 1]);
  return (
    <div className="flex h-full flex-col items-center bg-cream-50 px-4 pt-14 text-center">
      <div className="font-display text-[17px] font-semibold text-espresso-950">Cảm ơn bạn!</div>
      <div className="mt-1 text-[10px] leading-snug text-espresso-600">Đánh giá của bạn giúp quán hoàn thiện hơn</div>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <FillStar key={i} p={p} at={0.68 + i * 0.045} />
        ))}
      </div>
      <div className="mt-6 w-full rounded-2xl bg-white p-3 text-left ring-1 ring-cream-200">
        <div className="text-[11px] font-semibold text-espresso-950">Thẻ thành viên</div>
        <div className="mt-2 flex justify-between">
          {["on", "on", "new", "off", "off"].map((s, i) => (
            <Stamp key={i} p={p} state={s} />
          ))}
        </div>
      </div>
      <motion.div style={{ opacity: followed }} className="mt-4 flex items-center gap-1.5 rounded-full bg-sage-500/15 px-3 py-1.5 text-[10px] font-medium text-sage-500">
        <Check size={12} strokeWidth={3} /> Đã theo dõi
      </motion.div>
    </div>
  );
}

// Bản tĩnh cho người dùng bật "giảm chuyển động": không ghim, không gắn hiệu ứng theo cuộn.
function StoryStatic() {
  return (
    <section id="story" className="scroll-mt-16 bg-stage-dark py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-semibold text-cream-50 sm:text-4xl">Từ một cú chạm đến một khách quen</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((s) => (
              <li key={s.title}>
                <div className="text-lg font-semibold text-amber-400">{s.title}</div>
                <p className="mt-1 max-w-md text-cream-100/75">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
        <Phone className="mx-auto w-[220px]">
          <BrandScreen />
        </Phone>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Mô hình phù hợp */
function UseCases({ title }) {
  return (
    <section id="usecases" className="scroll-mt-16 overflow-x-clip py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-[-0.02em] text-espresso-950 sm:text-5xl">
          {title || "Phù hợp với mọi mô hình Online-to-Offline"}
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          {CASES.map((c, i) => (
            <TiltCard
              key={c.title}
              max={5}
              spot={c.spot}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (i % 2) * 0.1 }}
              className={`group min-h-[330px] overflow-hidden rounded-[28px] p-7 sm:p-9 ${c.span} ${c.tone}`}
            >
              <div className="relative z-10 max-w-[15rem] sm:max-w-[55%]">
                <h3 className="font-display text-2xl font-semibold sm:text-3xl">{c.title}</h3>
                <p className={`mt-3 leading-relaxed ${c.sub}`}>{c.desc}</p>
              </div>
              <div className="pointer-events-none absolute -bottom-3 -right-3 h-[62%] w-[62%] max-w-[330px] transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-105 sm:-right-2">
                <c.Art />
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Kêu gọi hành động cuối trang */
function FinalCta() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [90, -90]);
  const y2 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-60, 70]);
  const scale = useTransform(scrollYProgress, [0, 0.4], reduce ? [1, 1] : [0.93, 1]);

  return (
    <section id="cta" className="scroll-mt-16 px-5 pb-20 sm:pb-28">
      <motion.div ref={ref} style={{ scale }} className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-stage-dark px-6 py-20 text-center sm:py-28">
        <motion.div aria-hidden="true" style={{ y: y1 }} className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
        <motion.div aria-hidden="true" style={{ y: y2 }} className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-clay-500/25 blur-3xl" />

        <div className="relative">
          <MascotIllustration size={92} mood="wave" className="mx-auto animate-float" />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.01em] text-cream-50 sm:text-5xl">
            Sẵn sàng biến mỗi lượt khách ghé thành một khách hàng thân thiết?
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-cream-50 px-7 py-3.5 font-medium text-espresso-950 transition-colors hover:bg-cream-100"
            >
              Bắt đầu miễn phí ngay
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/store" className="font-medium text-cream-100 underline decoration-amber-400/60 underline-offset-4 hover:decoration-amber-400">
              Xem bảng giá
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
