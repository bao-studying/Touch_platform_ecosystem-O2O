import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

// Bộ hiệu ứng dùng chung cho các trang công khai (Home / About / Store).
// Tất cả đều tự tắt khi người dùng bật "giảm chuyển động" của hệ điều hành (prefers-reduced-motion).

// Thẻ nghiêng 3D theo con trỏ + ánh sáng đi theo chuột (xem .spotlight trong index.css).
export function TiltCard({ children, className = "", max = 7, spot, style, ...rest }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 220, damping: 22 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 220, damping: 22 });

  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (reduce) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, ...(spot ? { "--spot": spot } : {}), ...style }}
      className={`spotlight ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Chỉ có ánh sáng đi theo chuột (không nghiêng) — dùng cho thẻ giá, nơi cần giữ chữ thẳng hàng dễ đọc.
export function Spotlight({ children, className = "", spot, ...rest }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onPointerMove={onMove} style={spot ? { "--spot": spot } : undefined} className={`spotlight ${className}`} {...rest}>
      {children}
    </div>
  );
}

// Đoạn chữ lớn "sáng dần" từng từ theo tiến độ cuộn — người xem đọc đến đâu chữ rõ đến đó.
export function ScrollWords({ text, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} w={w} i={i} n={words.length} p={scrollYProgress} reduce={reduce} />
      ))}
    </p>
  );
}

function Word({ w, i, n, p, reduce }) {
  const opacity = useTransform(p, [i / n, (i + 1) / n], [0.16, 1]);
  return (
    <motion.span style={{ opacity: reduce ? 1 : opacity }} className="mr-[0.26em] inline-block">
      {w}
    </motion.span>
  );
}

// Ảnh có chiều sâu: khung cố định, ảnh bên trong trượt chậm hơn cuộn trang.
export function ParallaxImage({ src, alt = "", className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img src={src} alt={alt} style={{ y, scale: 1.2 }} className="h-full w-full object-cover" />
    </div>
  );
}

// Lớp có độ sâu: dịch chuyển theo chuột (sx, sy ∈ [-0.5, 0.5]) và theo tiến độ cuộn của section.
export function DepthLayer({ depth = 1, sx, sy, scroll, reduce, className = "", children }) {
  const px = useTransform(sx, (v) => (reduce ? 0 : v * 44 * depth));
  const py = useTransform(sy, (v) => (reduce ? 0 : v * 44 * depth));
  const sc = useTransform(scroll, [0, 1], [0, reduce ? 0 : -150 * depth]);
  const y = useTransform([py, sc], ([a, b]) => a + b);
  return (
    <motion.div style={{ x: px, y }} className={className}>
      {children}
    </motion.div>
  );
}

// Con trỏ chuột → 2 giá trị lò xo mượt (dùng cùng DepthLayer).
export function usePointerDepth() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 18 });
  const sy = useSpring(my, { stiffness: 70, damping: 18 });
  const onPointerMove = (e) => {
    if (e.pointerType === "touch") return;
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };
  return { sx, sy, onPointerMove };
}

// Tiêu đề hiện từng từ trượt lên từ sau "mặt nạ" — dùng đúng 1 lần ở đầu mỗi trang.
export function RevealWords({ text, className = "", delay = 0, as: Tag = "h1" }) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className}>
      {text.split(" ").map((w, i) => (
        <span key={`${i}-${w}`} className="mr-[0.24em] inline-block overflow-hidden py-[0.16em] -my-[0.16em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "115%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : delay + i * 0.05 }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
