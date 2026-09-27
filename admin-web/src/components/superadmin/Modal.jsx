import { X } from "lucide-react";

export default function Modal({ title, onClose, children, maxWidth = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className={`bg-white rounded-t-2xl sm:rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-medium text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
