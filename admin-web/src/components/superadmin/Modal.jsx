import { X } from "lucide-react";

export default function Modal({ title, onClose, children, maxWidth = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className={`bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-neutral-900">
          <h3 className="font-medium text-white">{title}</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
