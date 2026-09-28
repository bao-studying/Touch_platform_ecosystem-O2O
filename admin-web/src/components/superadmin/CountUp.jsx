import { useEffect, useState } from "react";
import { animate } from "framer-motion";

// Đếm số từ giá trị cũ → giá trị mới (mượt, easeOut). format() cho phép định dạng tiền / phần trăm.
export default function CountUp({ value = 0, format = (n) => Math.round(n).toLocaleString("vi-VN"), duration = 0.9 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(display, Number(value) || 0, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="[font-variant-numeric:tabular-nums]">{format(display)}</span>;
}
