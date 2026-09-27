import { X } from "lucide-react";
import useDismissablePopup from "../../../hooks/useDismissablePopup";

// Wrapper popup dùng chung cho mọi màn chỉnh sửa trong Setup Tab kiểu Facebook —
// hiện như bottom-sheet trên mobile, modal căn giữa trên desktop.
// Bấm ra ngoài (backdrop) hoặc nút X đều đóng popup, có hiệu ứng ẩn mượt trước khi biến mất.
export default function EditPopup({ title, onClose, children, footer }) {
  const { closing, requestClose, backdropProps } = useDismissablePopup(onClose);

  return (
    <div
      {...backdropProps}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-espresso-950/50 backdrop-blur-sm p-0 sm:p-4 ${
        closing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div
        className={`w-full sm:max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl glass-panel shadow-xl flex flex-col ${
          closing ? "animate-pop-out" : "animate-pop-in"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-espresso-900/8 shrink-0">
          <h3 className="font-display text-lg text-espresso-950">{title}</h3>
          <button onClick={requestClose} className="text-espresso-700/50 p-1" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-espresso-900/8 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
