import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, PackageOpen, ShoppingBag } from "lucide-react";
import api from "../../api/axios";
import { socket } from "../../lib/socket";
import PaymentPanel from "./PaymentPanel";
import { ORDER_FLOW, ORDER_STATUS, PAYMENT_METHOD_LABEL, isPaidStatus, paymentBadge, shortCode, vnd } from "./ui";

const fmtDate = (d) => {
  const date = new Date(d);
  if (!d || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Đơn hàng của chính khách — trước đây chỉ Super Admin thấy. Trạng thái tự cập nhật khi Super Admin đổi (Socket.IO "order:status").
export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(
    () =>
      api
        .get("/orders/mine")
        .then((res) => {
          setOrders(res.data);
          setError("");
        })
        .catch(() => setError("Không tải được đơn hàng, vui lòng thử lại"))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
    socket.on("order:status", load);
    return () => socket.off("order:status", load);
  }, [load]);

  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-cream-100" />;
  if (error) return <p className="rounded-2xl bg-clay-500/10 px-4 py-3 text-sm text-clay-500">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-cream-200">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-espresso-600">
          <PackageOpen size={24} />
        </span>
        <h2 className="mt-5 font-display text-xl font-semibold text-espresso-950">Bạn chưa có đơn hàng nào</h2>
        <p className="mt-1.5 text-sm text-espresso-600">Các đơn đặt vật phẩm decor sẽ hiện ở đây để bạn theo dõi.</p>
        <Link to="/store" className="mt-6 rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-espresso-800">
          Đến cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
        const open = openId === o._id;
        const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
        const cancelled = o.status === "cancelled";
        const stepIdx = ORDER_FLOW.indexOf(o.status);
        const thumb = o.items.find((i) => i.product?.imageUrl)?.product.imageUrl;
        const pay = paymentBadge(o);
        const needsPayment = o.paymentMethod === "bank_transfer" && !isPaidStatus(o.paymentStatus) && !cancelled && o.payment;

        return (
          <li key={o._id} className="overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200">
            <button onClick={() => setOpenId(open ? null : o._id)} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
              <div className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-100 sm:block">
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-espresso-700 to-espresso-900">
                    <ShoppingBag size={18} className="text-amber-400/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-display text-base font-semibold text-espresso-950">{shortCode(o._id)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-espresso-600">
                  {[fmtDate(o.createdAt), `${itemCount} sản phẩm`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-base font-semibold text-espresso-950">{vnd(o.totalVnd)}</div>
                <div className={`text-xs font-medium ${pay.tone}`}>{pay.label}</div>
              </div>
              <ChevronDown size={18} className={`shrink-0 text-espresso-600 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="space-y-6 border-t border-cream-100 p-4 sm:p-5">
                    {/* Tiến trình */}
                    {cancelled ? (
                      <p className="rounded-xl bg-clay-500/10 px-4 py-3 text-sm text-clay-500">Đơn hàng đã bị hủy. Nếu cần hỗ trợ, vui lòng liên hệ O2O.</p>
                    ) : (
                      <ol className="grid grid-cols-4 gap-2">
                        {ORDER_FLOW.map((s, i) => {
                          const done = i <= stepIdx;
                          return (
                            <li key={s} className="text-center">
                              <div className="flex items-center">
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-espresso-900 text-cream-50" : "bg-cream-100 text-espresso-600"}`}>
                                  {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                                </span>
                                {i < ORDER_FLOW.length - 1 && <span className={`h-0.5 flex-1 ${i < stepIdx ? "bg-espresso-900" : "bg-cream-200"}`} />}
                              </div>
                              <div className={`mt-1.5 text-left text-[11px] leading-tight ${done ? "font-medium text-espresso-950" : "text-espresso-600"}`}>{ORDER_STATUS[s].label}</div>
                            </li>
                          );
                        })}
                      </ol>
                    )}

                    {/* Sản phẩm */}
                    <ul className="divide-y divide-cream-100 rounded-2xl bg-cream-50 px-4 ring-1 ring-cream-200">
                      {o.items.map((i) => (
                        <li key={i._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <span className="text-espresso-900">
                            {i.name} <span className="text-espresso-600">× {i.qty}</span>
                          </span>
                          <span className="font-medium text-espresso-950">{vnd(i.priceVnd * i.qty)}</span>
                        </li>
                      ))}
                      <li className="flex items-center justify-between py-3 text-sm font-semibold text-espresso-950">
                        <span>Tổng cộng</span>
                        <span className="font-display text-lg">{vnd(o.totalVnd)}</span>
                      </li>
                    </ul>

                    {/* Đơn chuyển khoản chưa trả đủ: hiện luôn mã QR để thanh toán ngay tại đây */}
                    {needsPayment && <PaymentPanel order={o} compact onPaid={load} />}

                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-espresso-600">Thanh toán</div>
                        <p className="mt-1 leading-relaxed text-espresso-800">
                          {PAYMENT_METHOD_LABEL[o.paymentMethod] || PAYMENT_METHOD_LABEL.cod}
                          <span className={`ml-2 font-medium ${pay.tone}`}>· {pay.label}</span>
                        </p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-espresso-600">Giao đến</div>
                        <p className="mt-1 leading-relaxed text-espresso-800">{o.shippingAddress || "Chưa cung cấp"}</p>
                      </div>
                      {o.note && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-espresso-600">Ghi chú</div>
                          <p className="mt-1 leading-relaxed text-espresso-800">{o.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
