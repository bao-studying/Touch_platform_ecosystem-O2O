import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, ring: "ring-emerald-500/30", iconTone: "text-emerald-400", bar: "bg-emerald-400" },
  error: { icon: XCircle, ring: "ring-red-500/30", iconTone: "text-red-400", bar: "bg-red-400" },
  info: { icon: Info, ring: "ring-orange-500/30", iconTone: "text-orange-400", bar: "bg-orange-400" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (variant, title, description, duration = 3500) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, variant, title, description, duration }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description, 5000),
      info: (title, description) => push("info", title, description),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[70] top-4 right-4 left-4 sm:left-auto sm:w-[360px] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const v = VARIANTS[t.variant];
            const Icon = v.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`pointer-events-auto relative overflow-hidden bg-neutral-900/95 backdrop-blur-md border border-white/10 ring-1 ${v.ring} rounded-2xl shadow-2xl shadow-black/50`}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.08 }}
                    className={`mt-0.5 ${v.iconTone}`}
                  >
                    <Icon size={20} />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{t.title}</div>
                    {t.description && <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{t.description}</div>}
                  </div>
                  <button onClick={() => dismiss(t.id)} className="text-neutral-600 hover:text-white transition-colors" aria-label="Đóng">
                    <X size={15} />
                  </button>
                </div>
                <motion.div
                  className={`h-0.5 ${v.bar} origin-left`}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  return ctx;
}
