import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Check, CheckCircle2, Clock, Copy, Loader2, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import api from "../../api/axios";
import { socket } from "../../lib/socket";
import { isPaidStatus, shortCode, vnd } from "./ui";

// Màn hình thanh toán chuyển khoản qua SePay: mã QR + thông tin tài khoản + nội dung chuyển khoản.
// Tự phát hiện tiền về: nghe Socket.IO ("order:status") và có thêm vòng kiểm tra định kỳ phòng khi socket rớt.
// `compact`: dùng bên trong chi tiết đơn (tab Đơn hàng) — bỏ tiêu đề lớn và nút điều hướng sau khi thanh toán xong.

function CopyButton({ value, label }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
    } catch {
      // Trình duyệt chặn clipboard (http, iframe...) → dùng cách dự phòng.
      const el = document.createElement("textarea");
      el.value = String(value);
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* không sao chép được thì người dùng vẫn nhập tay được */
      }
      el.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Sao chép ${label}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        done ? "bg-sage-500/15 text-sage-500" : "bg-cream-100 text-espresso-800 hover:bg-cream-200"
      }`}
    >
      {done ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />} {done ? "Đã chép" : "Chép"}
    </button>
  );
}

function Row({ label, value, copy, strong }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-cream-100 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-espresso-600">{label}</div>
        <div className={`break-all ${strong ? "font-display text-lg font-semibold text-espresso-950" : "text-sm font-medium text-espresso-900"}`}>{value}</div>
      </div>
      {copy && <CopyButton value={copy} label={label} />}
    </div>
  );
}

export default function PaymentPanel({ order, compact = false, onPaid }) {
  const [current, setCurrent] = useState(order);
  const [checking, setChecking] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(""); // "renew" | "simulate"
  const [error, setError] = useState("");
  const notified = useRef(false);
  const paid = isPaidStatus(current.paymentStatus);
  const pay = current.payment;

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const res = await api.get(`/orders/${order._id}`);
      setCurrent(res.data);
    } catch {
      /* mạng chập chờn — lần kiểm tra sau sẽ thử lại */
    } finally {
      setChecking(false);
    }
  }, [order._id]);

  // Tiền về → server phát "order:status" cho khách → kiểm tra lại đơn ngay.
  useEffect(() => {
    if (paid) return;
    const onStatus = (p) => (!p?.orderId || String(p.orderId) === String(order._id)) && refresh();
    socket.on("order:status", onStatus);
    // Dự phòng giống Client Web: hỏi lại mỗi 3 giây khi tab đang mở (socket có thể rớt trên mạng di động).
    const t = setInterval(() => document.visibilityState === "visible" && refresh(), 3000);
    return () => {
      socket.off("order:status", onStatus);
      clearInterval(t);
    };
  }, [paid, order._id, refresh]);

  // Đồng hồ đếm ngược hạn của mã QR (15 phút). Chỉ để hiển thị — quá hạn mà khách đã chuyển khoản thì server VẪN ghi nhận.
  useEffect(() => {
    if (paid || !pay?.expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [paid, pay?.expiresAt]);

  useEffect(() => {
    if (paid && !notified.current) {
      notified.current = true;
      onPaid?.(current);
    }
  }, [paid, current, onPaid]);

  const remaining = pay?.expiresAt ? Math.max(0, Math.floor((new Date(pay.expiresAt) - now) / 1000)) : null;
  const expired = remaining === 0;
  const mm = String(Math.floor((remaining || 0) / 60)).padStart(2, "0");
  const ss = String((remaining || 0) % 60).padStart(2, "0");

  const renew = async () => {
    setBusy("renew");
    setError("");
    try {
      const res = await api.post(`/orders/${order._id}/renew-payment`);
      setCurrent(res.data);
      setQrFailed(false);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể làm mới mã, vui lòng thử lại");
    } finally {
      setBusy("");
    }
  };

  // Chỉ có khi CHƯA cấu hình tài khoản SePay (môi trường dev) — giống nút giả lập ở Client Web.
  const simulate = async () => {
    setBusy("simulate");
    setError("");
    try {
      const res = await api.post(`/orders/${order._id}/simulate-payment`);
      setCurrent(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể giả lập thanh toán");
    } finally {
      setBusy("");
    }
  };

  // ---- Đã thanh toán ----
  if (paid) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className={`text-center ${compact ? "rounded-2xl bg-sage-500/10 p-5" : "mx-auto max-w-md rounded-3xl bg-white px-6 py-12 ring-1 ring-cream-200"}`}>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-500/15 text-sage-500"
        >
          <CheckCircle2 size={28} />
        </motion.span>
        <h2 className="mt-4 font-display text-xl font-semibold text-espresso-950">Đã nhận thanh toán {vnd(current.paidVnd || current.totalVnd)}</h2>
        <p className="mt-1.5 text-sm text-espresso-700">
          Đơn {shortCode(current._id)} đã được xác nhận. O2O sẽ sớm bắt đầu xử lý và cập nhật trạng thái cho bạn.
        </p>
        {!compact && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/account?tab=orders" className="rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-espresso-800">
              Xem đơn hàng của tôi
            </Link>
            <Link to="/store" className="rounded-full px-5 py-2.5 text-sm font-medium text-espresso-700 hover:bg-cream-100">
              Tiếp tục mua sắm
            </Link>
          </div>
        )}
      </motion.div>
    );
  }

  if (!pay) {
    // Đơn đã hủy hoặc chưa cấu hình tài khoản nhận tiền — không có gì để hiển thị.
    return <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm text-espresso-700">Đơn này hiện không thể thanh toán online. Vui lòng liên hệ O2O để được hỗ trợ.</p>;
  }
  const partial = current.paymentStatus === "partial";

  return (
    <div className={compact ? "" : "mx-auto max-w-3xl rounded-3xl bg-white p-5 ring-1 ring-cream-200 sm:p-8"}>
      {!compact && (
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/20 text-amber-600">
            <QrCode size={22} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-espresso-950">Thanh toán đơn {shortCode(current._id)}</h2>
          <p className="mt-1.5 text-sm text-espresso-700">Quét mã QR bằng app ngân hàng hoặc chuyển khoản theo thông tin bên dưới. Hệ thống tự xác nhận trong vài giây.</p>
        </div>
      )}

      {partial && (
        <p className="mb-4 rounded-xl bg-amber-400/15 px-4 py-3 text-sm text-espresso-900">
          Đã nhận <strong>{vnd(pay.paid)}</strong> / {vnd(pay.total)}. Vui lòng chuyển nốt <strong>{vnd(pay.amount)}</strong> còn lại (mã QR bên dưới đã cập nhật đúng số tiền).
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-[220px_1fr] sm:items-start">
        <div className="mx-auto w-full max-w-[240px]">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-cream-200">
            {!pay.qrUrl ? (
              <div className="flex h-full items-center justify-center p-3 text-center text-xs text-amber-600">
                Chưa cấu hình tài khoản SePay nên chưa có mã QR.
              </div>
            ) : qrFailed ? (
              <div className="flex h-full items-center justify-center p-3 text-center text-xs text-espresso-600">Không tải được mã QR — hãy chuyển khoản theo thông tin bên cạnh.</div>
            ) : (
              <img src={pay.qrUrl} alt={`Mã QR chuyển khoản ${vnd(pay.amount)}`} className={`h-full w-full object-contain transition ${expired ? "opacity-20 blur-sm" : ""}`} onError={() => setQrFailed(true)} />
            )}
            {expired && pay.qrUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 p-3 text-center">
                <AlertTriangle size={22} className="text-clay-500" />
                <span className="text-xs font-medium text-espresso-900">Mã QR đã hết hạn</span>
                <button onClick={renew} disabled={busy === "renew"} className="inline-flex items-center gap-1.5 rounded-full bg-espresso-900 px-4 py-1.5 text-xs font-medium text-cream-50 disabled:opacity-60">
                  {busy === "renew" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Làm mới mã
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-espresso-600">Mở app ngân hàng → Quét QR</p>
        </div>

        <div>
          <div className="rounded-2xl bg-cream-50 px-4 ring-1 ring-cream-200">
            <Row label="Ngân hàng" value={pay.bank} />
            {pay.accountName && <Row label="Chủ tài khoản" value={pay.accountName} />}
            <Row label="Số tài khoản" value={pay.accountNumber} copy={pay.accountNumber} />
            <Row label="Số tiền" value={vnd(pay.amount)} copy={pay.amount} strong />
            <Row label="Nội dung chuyển khoản" value={pay.content} copy={pay.content} strong />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-espresso-700">
            Nhập <strong>đúng nội dung</strong> <span className="font-mono font-semibold text-espresso-950">{pay.content}</span> và đúng số tiền để đơn được xác nhận tự động. Quét QR sẽ tự điền sẵn cả hai.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream-100 px-4 py-3">
        <span className="flex items-center gap-2.5 text-sm text-espresso-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
          Đang chờ thanh toán…
          {remaining !== null && !expired && (
            <span className="inline-flex items-center gap-1 text-espresso-600">
              <Clock size={13} /> hết hạn sau <span className="font-mono font-medium text-espresso-900">{mm}:{ss}</span>
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-espresso-900 ring-1 ring-cream-200 transition-colors hover:bg-cream-50 disabled:opacity-60"
        >
          {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Kiểm tra lại
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl bg-clay-500/10 px-4 py-2.5 text-xs text-clay-500">{error}</p>}

      {pay.configured ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-sage-400/10 px-3 py-2 text-[11px] text-sage-500">
          <ShieldCheck size={13} /> Quét mã và chuyển khoản đúng nội dung — hệ thống tự xác nhận qua SePay, không cần thao tác gì thêm.
        </p>
      ) : (
        <button
          type="button"
          onClick={simulate}
          disabled={busy === "simulate"}
          className="mt-3 w-full rounded-xl border border-dashed border-espresso-900/25 py-2.5 text-xs font-medium text-espresso-700/80 transition-colors hover:bg-cream-50 disabled:opacity-60"
        >
          {busy === "simulate" ? "Đang xử lý..." : "Giả lập thanh toán thành công (demo — chưa cấu hình SePay thật)"}
        </button>
      )}

      {!compact && (
        <p className="mt-4 text-center text-xs text-espresso-600">
          Bạn có thể đóng trang này — đơn vẫn lưu trong <Link to="/account?tab=orders" className="font-medium text-clay-500 underline underline-offset-2">Đơn hàng của tôi</Link>, mở lại bất cứ lúc nào để thanh toán.
        </p>
      )}
    </div>
  );
}
