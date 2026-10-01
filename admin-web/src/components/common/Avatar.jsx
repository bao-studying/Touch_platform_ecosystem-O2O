// Avatar tròn theo tên: chữ cái đầu của TÊN GỌI (từ cuối — "Nguyễn Gia Bảo" → "B") trên nền gradient cố định theo tên,
// nên cùng 1 người luôn cùng 1 màu ở mọi nơi (navbar, trang Tài khoản, menu).
const TONES = [
  "from-amber-400 to-clay-500",
  "from-sage-400 to-sage-500",
  "from-espresso-600 to-espresso-900",
  "from-clay-500 to-espresso-800",
  "from-amber-500 to-espresso-700",
];

export const initialOf = (name = "") => (name.trim().split(/\s+/).pop() || "?").charAt(0).toUpperCase();

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function Avatar({ name = "", size = 36, className = "", ring = false }) {
  const tone = TONES[hash(name || "?") % TONES.length];
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br ${tone} font-display font-semibold leading-none text-cream-50 ${
        ring ? "ring-2 ring-cream-50 shadow-[0_0_0_3px_rgba(59,35,24,0.12)]" : ""
      } ${className}`}
    >
      {initialOf(name)}
    </span>
  );
}
