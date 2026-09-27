import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

// Toast dùng chung toàn app — thay cho việc mỗi popup tự lặng lẽ đóng lại khi lưu xong mà
// không có phản hồi rõ ràng nào cho người dùng. Gọi qua hook useToast() ở bất kỳ đâu trong cây.
const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: "bg-espresso-950 text-cream-50",
  error: "bg-clay-600 text-cream-50",
  info: "bg-espresso-800 text-cream-50",
};
const ICON_COLOR = { success: "text-sage-400", error: "text-cream-50", info: "text-amber-400" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 2800) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg animate-pop-in ${STYLES[t.type] || STYLES.info}`}
              role="status"
            >
              <Icon size={18} className={`shrink-0 ${ICON_COLOR[t.type] || ICON_COLOR.info}`} />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Đóng thông báo">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast phải dùng bên trong <ToastProvider>");
  return ctx;
}
