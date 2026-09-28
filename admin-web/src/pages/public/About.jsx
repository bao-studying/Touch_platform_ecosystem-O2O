import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import api from "../../api/axios";
import MascotIllustration from "../../components/common/MascotIllustration";
import { ParallaxImage, RevealWords, ScrollWords } from "../../components/public/fx";
import { ApproachArt, MissionArt, ValuesArt } from "../../components/public/illustrations";

const VALUES = [
  {
    title: "Sứ mệnh",
    desc: "Giúp doanh nghiệp vừa và nhỏ quảng bá thương hiệu hiệu quả, chi phí hợp lý.",
    Art: MissionArt,
    tone: "bg-cream-100 text-espresso-950 ring-1 ring-cream-200",
    sub: "text-espresso-700",
  },
  {
    title: "Cách tiếp cận",
    desc: "Kết nối thế giới vật lý và trải nghiệm số qua một cú chạm NFC hoặc quét QR.",
    Art: ApproachArt,
    tone: "bg-espresso-900 text-cream-50",
    sub: "text-cream-100/75",
  },
  {
    title: "Giá trị cốt lõi",
    desc: "Đơn giản để dùng, dễ để đo lường hiệu quả, không cần đội ngũ kỹ thuật riêng.",
    Art: ValuesArt,
    tone: "bg-[#F3DFB5] text-espresso-950 ring-1 ring-amber-400/30",
    sub: "text-espresso-700",
  },
];

export default function About() {
  const [cms, setCms] = useState({});

  useEffect(() => {
    api.get("/public/cms").then((res) => setCms(res.data)).catch(() => {});
  }, []);

  const about = cms.about || {};

  return (
    <div>
      <AboutHero about={about} />
      <Manifesto />
      <Values />
      <Closing />
    </div>
  );
}

function AboutHero({ about }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);

  return (
    <section ref={ref} className="relative overflow-x-clip bg-paper-dots">
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 640 640"
        style={{ rotate, y: artY }}
        className="pointer-events-none absolute -right-52 top-1/2 h-[640px] w-[640px] -translate-y-1/2 opacity-70 md:-right-24"
      >
        <circle cx="320" cy="320" r="300" fill="none" stroke="#D4A24C" strokeWidth="1.5" strokeDasharray="2 12" strokeLinecap="round" />
        <circle cx="320" cy="320" r="230" fill="none" stroke="#8FA382" strokeWidth="1.5" strokeDasharray="2 12" strokeLinecap="round" />
        <circle cx="320" cy="320" r="160" fill="none" stroke="#B8562F" strokeWidth="1.5" strokeDasharray="2 12" strokeLinecap="round" />
        <circle cx="320" cy="20" r="9" fill="#D4A24C" />
        <circle cx="90" cy="450" r="7" fill="#8FA382" />
        <circle cx="440" cy="480" r="8" fill="#B8562F" />
      </motion.svg>
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />

      <motion.div style={{ y: textY }} className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 md:pb-28 md:pt-32">
        <RevealWords
          text={about.title || "Về O2O Brand Promotion"}
          className="max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.02em] text-espresso-950 sm:text-6xl md:text-7xl"
        />
        {about.bodyHtml && (
          <div
            className="mt-8 max-w-xl text-lg leading-relaxed text-espresso-700 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: about.bodyHtml }}
          />
        )}
        {about.imageUrl && (
          <ParallaxImage src={about.imageUrl} alt="" className="mt-14 aspect-[16/8] rounded-[2rem] shadow-[0_40px_80px_-40px_rgba(42,24,16,0.55)]" />
        )}
      </motion.div>
    </section>
  );
}

// Câu định vị thương hiệu — sáng dần từng từ theo nhịp cuộn của người đọc.
function Manifesto() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-24 md:py-40">
      <ScrollWords
        text="Nền tảng SaaS biến mỗi vật phẩm decor trên bàn thành một điểm chạm quảng bá thương hiệu — chạm NFC hoặc quét QR là mở ngay trang thương hiệu của bạn."
        className="font-display text-[1.9rem] leading-[1.2] tracking-[-0.01em] text-espresso-950 sm:text-5xl"
      />
    </section>
  );
}

// 3 thẻ xếp chồng: mỗi thẻ dính lại khi cuộn, thẻ sau trượt đè lên thẻ trước và thẻ trước thu nhỏ nhẹ → cảm giác có lớp, có độ sâu.
function Values() {
  const listRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start start", "end end"] });
  const n = VALUES.length;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16">
      <div ref={listRef}>
        {VALUES.map((v, i) => (
          <StackCard key={v.title} v={v} i={i} n={n} p={scrollYProgress} reduce={reduce} />
        ))}
      </div>
    </section>
  );
}

function StackCard({ v, i, n, p, reduce }) {
  const last = i === n - 1;
  const scale = useTransform(p, last ? [0, 1] : [i / (n - 1), 1], last || reduce ? [1, 1] : [1, 1 - (n - 1 - i) * 0.05]);
  return (
    <div style={{ top: 72 + i * 16 }} className="sticky flex h-[calc(100svh-6rem)] min-h-[34rem] items-center">
      <motion.div style={{ scale }} className={`grid w-full origin-top overflow-hidden rounded-[2rem] shadow-[0_30px_70px_-40px_rgba(42,24,16,0.6)] md:grid-cols-2 ${v.tone}`}>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{v.title}</h2>
          <p className={`mt-5 max-w-sm text-lg leading-relaxed ${v.sub}`}>{v.desc}</p>
        </div>
        <div className="flex items-center justify-center px-8 pb-8 md:p-10">
          <div className="h-52 w-full max-w-sm md:h-72">
            <v.Art />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Closing() {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-28 pt-12 text-center">
      <MascotIllustration size={72} mood="wave" className="mx-auto animate-float" />
      <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.01em] text-espresso-950 sm:text-4xl">
        Có câu hỏi về việc triển khai cho quán của bạn?
      </h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/contact"
          className="group inline-flex items-center gap-2 rounded-full bg-espresso-900 px-7 py-3.5 font-medium text-cream-50 transition-colors hover:bg-espresso-800"
        >
          Liên hệ với chúng tôi
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
        </Link>
        <Link to="/register" className="font-medium text-espresso-800 underline decoration-clay-500/50 underline-offset-4 hover:decoration-clay-500">
          Bắt đầu miễn phí
        </Link>
      </div>
    </section>
  );
}
