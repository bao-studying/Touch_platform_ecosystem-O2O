import { useEffect, useRef, useState } from "react";
import { Copy, Check, X, Clock, PartyPopper, AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import api from "../../api/axios";
import useDismissablePopup from "../../hooks/useDismissablePopup";

const PLAN_LABEL = { level1: "Level 1", level2: "Level 2", level3: "Level 3" };

function CopyLine({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-espresso-900/8 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-espresso-700/40">{label}</p>
        <p className="text-sm text-espresso-900 font-medium truncate">{value || "—"}</p>
      </div>
      {value && (
        <button onClick={handleCopy} className="shrink-0 text-espresso-700/50">
          {copied ? <Check size={15} className="text-sage-500" /> : <Copy size={15} />}
        </button>
      )}
    </div>
  );
}

// Modal thanh toán nâng cấp gói qua SePay (chuyển khoản ngân hàng, đối soát qua webhook thật hoặc nút giả lập demo).
export default function PaymentModal({ plan, businessId, onClose, onSuccess }) {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | pending | paid | expired | error
  const [remainingSec, setRemainingSec] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  const [errorMsg, setErrorMsg] = useState("");

  const createOrder = async () => {
    setStatus("loading");
    try {
      const res = await api.post("/payments", { business: businessId, plan });
      setOrder(res.data);
      setStatus("pending");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không tạo được đơn thanh toán");
      setStatus("error");
    }
  };

  useEffect(() => {
    createOrder();
    return () => {
      clearInterval(pollRef.current);
      clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đếm ngược hiển thị (nguồn xác thực thời gian thật vẫn là server, đây chỉ để hiện đồng hồ cho khách)
  useEffect(() => {
    if (!order || status !== "pending") return;
    const update = () => setRemainingSec(Math.max(0, Math.floor((new Date(order.expiresAt) - new Date()) / 1000)));
    update();
    tickRef.current = setInterval(update, 1000);
    return () => clearInterval(tickRef.current);
  }, [order, status]);

  // Poll trạng thái mỗi 3 giây
  useEffect(() => {
    if (!order || status !== "pending") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/payments/${order.orderId}`);
        if (res.data.status === "paid") {
          clearInterval(pollRef.current);
          setStatus("paid");
          setTimeout(() => onSuccess(plan), 2000);
        } else if (res.data.status === "expired") {
          clearInterval(pollRef.current);
          setStatus("expired");
        }
      } catch {
        /* bỏ qua lỗi tạm thời, thử lại lần poll sau */
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [order, status, onSuccess, plan]);

  const handleSimulateSuccess = async () => {
    setSimulating(true);
    try {
      await api.post(`/payments/${order.orderId}/simulate-success`);
      clearInterval(pollRef.current);
      setStatus("paid");
      setTimeout(() => onSuccess(plan), 2000);
    } finally {
      setSimulating(false);
    }
  };

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  // Không cho bấm ra ngoài để đóng khi vừa báo thanh toán thành công (đang tự chuyển sau 2s)
  const { closing, requestClose, backdropProps } = useDismissablePopup(onClose, { disabled: status === "paid" });

  return (
    <div
      {...backdropProps}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 ${
        closing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div className={`w-full max-w-sm rounded-2xl glass-panel p-5 shadow-xl relative ${closing ? "animate-pop-out" : "animate-pop-in"}`}>
        <button onClick={requestClose} className="absolute top-3 right-3 text-espresso-700/50" aria-label="Đóng">
          <X size={20} />
        </button>

        {status === "loading" && <p className="text-center text-sm text-espresso-700/60 py-10">Đang tạo đơn hàng...</p>}

        {status === "error" && (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto mb-2 text-clay-500" size={28} />
            <p className="text-sm text-espresso-900 font-medium">{errorMsg || "Không tạo được đơn thanh toán"}</p>
            <button onClick={createOrder} className="mt-4 flex items-center justify-center gap-1.5 mx-auto text-sm text-espresso-800 font-medium">
              <RotateCcw size={14} /> Thử lại
            </button>
          </div>
        )}

        {status === "pending" && order && (
          <>
            <h3 className="font-display text-lg text-espresso-950 mb-3">Thanh toán nâng cấp gói</h3>

            <div className="rounded-xl bg-espresso-900/5 px-3 py-2.5 flex items-center justify-between mb-4">
              <span className="text-sm text-espresso-700">{PLAN_LABEL[plan]} · 1 tháng</span>
              <span className="text-sm font-semibold text-espresso-900">{order.amount.toLocaleString("vi-VN")}đ</span>
            </div>

            {order.qrUrl ? (
              <img src={order.qrUrl} alt="Mã QR chuyển khoản" className="w-40 h-40 mx-auto rounded-xl ring-1 ring-espresso-900/10 mb-4" />
            ) : (
              <p className="text-center text-[11px] text-amber-600 bg-amber-400/10 rounded-lg px-3 py-2 mb-4">
                Chưa cấu hình SEPAY_BANK_ID/SEPAY_ACCOUNT_NO trong .env nên chưa tạo được mã QR — vẫn chuyển khoản thủ công theo thông tin bên dưới được.
              </p>
            )}

            <div className="rounded-xl bg-white ring-1 ring-espresso-900/5 px-3 mb-4">
              <CopyLine label="Ngân hàng" value={order.bankId} />
              <CopyLine label="Số tài khoản" value={order.accountNumber} />
              <CopyLine label="Chủ tài khoản" value={order.accountName} />
              <CopyLine label="Nội dung chuyển khoản" value={order.transferContent} />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-sm text-espresso-700 mb-4">
              <Clock size={15} />
              Đang chờ thanh toán... hết hạn sau <span className="font-mono font-medium">{mm}:{ss}</span>
            </div>

            {order.qrUrl ? (
              // Đã cấu hình SePay + webhook (ngrok/domain thật) → quét mã là xong, không cần nút giả lập nữa.
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-sage-500 bg-sage-400/10 rounded-lg px-3 py-2">
                <ShieldCheck size={13} /> Quét mã và chuyển khoản đúng nội dung — hệ thống tự xác nhận qua SePay, không cần thao tác gì thêm.
              </p>
            ) : (
              <button
                onClick={handleSimulateSuccess}
                disabled={simulating}
                className="w-full rounded-xl border border-dashed border-espresso-900/25 text-espresso-700/70 py-2.5 text-xs font-medium disabled:opacity-60"
              >
                {simulating ? "Đang xử lý..." : "Giả lập thanh toán thành công (demo — chưa cấu hình SePay thật)"}
              </button>
            )}
          </>
        )}

        {status === "paid" && (
          <div className="text-center py-8">
            <PartyPopper className="mx-auto mb-2 text-amber-500" size={36} />
            <p className="font-medium text-espresso-900">Thanh toán thành công!</p>
            <p className="text-xs text-espresso-700/60 mt-1">Đang cập nhật gói {PLAN_LABEL[plan]}...</p>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto mb-2 text-clay-500" size={28} />
            <p className="text-sm text-espresso-900 font-medium">Đơn hàng đã hết hạn</p>
            <p className="text-xs text-espresso-700/60 mt-1 mb-4">Vui lòng tạo lại đơn để tiếp tục thanh toán.</p>
            <button onClick={createOrder} className="rounded-xl bg-espresso-800 text-cream-50 px-4 py-2 text-sm font-medium">
              Tạo đơn mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
