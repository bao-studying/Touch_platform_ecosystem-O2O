import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

// Nút "Quay lại trang chủ" cho các trang Auth.
// Hiệu ứng: trượt vào từ trái khi trang mở → khi rê chuột, vòng tròn hổ phách quanh mũi tên loang ra
// phủ kín cả viên thuốc (clip-path), mũi tên lùi nhẹ về trái, chữ đổi sang màu tối để đọc được trên nền sáng.
export default function BackHomeButton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      className="inline-block"
    >
      <Link
        to="/"
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-cream-50/15 bg-cream-50/[0.06] py-1.5 pl-1.5 pr-5 backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_10px_30px_-10px_rgba(212,162,76,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500"
          initial={{ clipPath: "circle(19px at 22px 50%)" }}
          variants={{ hover: { clipPath: "circle(280px at 22px 50%)" } }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="relative z-10 flex h-9 w-9 items-center justify-center text-espresso-950">
          <motion.span
            className="flex"
            variants={{ hover: { x: -3 } }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            <ArrowLeft size={17} strokeWidth={2.4} />
          </motion.span>
        </span>
        <span className="relative z-10 text-sm font-medium text-cream-50 transition-colors duration-300 group-hover:text-espresso-950">
          Quay lại trang chủ
        </span>
      </Link>
    </motion.div>
  );
}
