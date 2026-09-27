import { Pencil } from "lucide-react";

// Nút "✎ Edit" nổi trên từng khối của trang xem trước thật — bấm vào mở popup chỉnh riêng phần đó.
export default function EditBadge({ onClick, className = "", label = "Edit" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full bg-espresso-950/80 backdrop-blur text-cream-50 text-[11px] font-medium px-2.5 py-1 shadow-md hover:bg-espresso-950 transition-colors ${className}`}
    >
      <Pencil size={11} /> {label}
    </button>
  );
}
