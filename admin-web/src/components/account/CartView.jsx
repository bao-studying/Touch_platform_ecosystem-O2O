import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Check, Loader2, MapPin, Minus, PackageCheck, Plus, QrCode, ShoppingBag, X } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import AddressForm from "./AddressForm";
import PaymentPanel from "./PaymentPanel";
import { Field, Notice, inputClass, shortCode, vnd } from "./ui";

// Giỏ hàng + đặt hàng. Dùng ở trang /cart và ở tab "Giỏ hàng" trong Tài khoản.
// Khách CHƯA đăng nhập: xem/sửa giỏ được, nút đặt hàng dẫn tới đăng nhập (giỏ được giữ nguyên).
// Khách ĐÃ đăng nhập: chọn địa chỉ từ sổ địa chỉ (hoặc thêm mới ngay tại đây) rồi đặt hàng.
export default function CartView({ embedded = false }) {
  const { admin } = useAuth();
  const { lines, count, total, catalogLoading, setQty, remove, clear, placeOrder } = useCart();
  const location = useLocation();

  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null); // đơn vừa đặt thành công
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod" | "bank_transfer"
  const [bankAvailable, setBankAvailable] = useState(true);
  const [bankDemo, setBankDemo] = useState(false); // chưa cấu hình tài khoản SePay (dev): vẫn đặt được, thanh toán bằng nút giả lập

  // Chuyển khoản chỉ chọn được khi Super Admin đã cấu hình tài khoản nhận tiền.
  useEffect(() => {
    api
      .get("/public/payment-options")
      .then((res) => {
        setBankAvailable(Boolean(res.data.bankTransfer));
        setBankDemo(!res.data.bankConfigured);
      })
      .catch(() => {});
  }, []);

  const adminId = admin?._id;
  useEffect(() => {
    if (!adminId) {
      setAddresses([]);
      return;
    }
    setAddrLoading(true);
    api
      .get("/customer/profile")
      .then((res) => {
        setAddresses(res.data.addresses);
        setSelected((cur) => (res.data.addresses.some((a) => a._id === cur) ? cur : res.data.addresses[0]?._id || ""));
      })
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  }, [adminId]);

  const onAddressSaved = (profile) => {
    setAddresses(profile.addresses);
    // Chọn luôn địa chỉ vừa thêm (là địa chỉ nằm cuối nếu không đặt mặc định, hoặc đứng đầu nếu là mặc định).
    const fresh = profile.addresses.find((a) => !addresses.some((o) => o._id === a._id));
    setSelected((fresh || profile.addresses[0])?._id || "");
    setAdding(false);
  };

  const checkout = async () => {
    setError("");
    setPlacing(true);
    try {
      const order = await placeOrder({ addressId: selected, note, paymentMethod });
      setPlaced(order);
      setNote("");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể đặt hàng, vui lòng thử lại");
    } finally {
      setPlacing(false);
    }
  };

  // ---- Đặt hàng xong ----
  if (placed) {
    // Chuyển khoản → chuyển thẳng sang màn hình quét QR; tiền về thì màn hình tự đổi sang "đã thanh toán".
    if (placed.paymentMethod === "bank_transfer" && placed.payment) return <PaymentPanel order={placed} />;
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-cream-200">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-500/15 text-sage-500">
          <PackageCheck size={26} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-espresso-950">Đặt hàng thành công!</h2>
        <p className="mt-2 text-sm leading-relaxed text-espresso-700">
          Mã đơn <strong className="text-espresso-950">{shortCode(placed._id)}</strong> · {vnd(placed.totalVnd)}.<br />
          Bạn thanh toán <strong>khi nhận hàng (COD)</strong>. Đội ngũ O2O sẽ liên hệ xác nhận đơn sớm nhất.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/account?tab=orders" className="rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-espresso-800">
            Xem đơn hàng của tôi
          </Link>
          <Link to="/store" className="rounded-full px-5 py-2.5 text-sm font-medium text-espresso-700 hover:bg-cream-100">
            Tiếp tục mua sắm
          </Link>
        </div>
      </motion.div>
    );
  }

  // ---- Giỏ trống ----
  if (!catalogLoading && lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-cream-200">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-espresso-600">
          <ShoppingBag size={24} />
        </span>
        <h2 className="mt-5 font-display text-xl font-semibold text-espresso-950">Giỏ hàng đang trống</h2>
        <p className="mt-1.5 max-w-xs text-sm text-espresso-600">Chọn vài vật phẩm decor gắn chip NFC ở cửa hàng để bắt đầu nhé.</p>
        <Link to="/store" className="mt-6 rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-espresso-800">
          Xem vật phẩm decor
        </Link>
      </div>
    );
  }

  const redirectBack = encodeURIComponent(embedded ? "/account?tab=cart" : location.pathname);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      {/* ===== Sản phẩm trong giỏ: lưới thẻ gọn — 1 hàng luôn hiện 3 thẻ (kể cả mobile) ===== */}
      <div className="rounded-3xl bg-white p-2.5 ring-1 ring-cream-200 sm:p-4">
        {catalogLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-cream-100" />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            <AnimatePresence initial={false}>
              {lines.map(({ product: p, qty }) => (
                <motion.li
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col overflow-hidden rounded-2xl bg-cream-50 ring-1 ring-cream-200"
                >
                  <div className="relative aspect-square bg-cream-100">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-espresso-700 to-espresso-900">
                        <ShoppingBag size={22} className="text-amber-400/60" />
                      </div>
                    )}
                    <button
                      onClick={() => remove(p._id)}
                      aria-label={`Xóa ${p.name} khỏi giỏ`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-espresso-700 shadow-sm transition-colors hover:bg-clay-500 hover:text-white"
                    >
                      <X size={13} strokeWidth={2.6} />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <h3 className="line-clamp-2 text-[11px] font-semibold leading-tight text-espresso-950 sm:text-sm">{p.name}</h3>
                    <div className="mt-auto">
                      <div className="font-display text-[12px] font-semibold text-espresso-950 sm:text-sm">{vnd(p.priceVnd * qty)}</div>
                      {qty > 1 && <div className="text-[10px] text-espresso-600">{vnd(p.priceVnd)}/cái</div>}
                    </div>
                    <div className="mt-1 flex items-center justify-between rounded-full bg-white p-0.5 ring-1 ring-cream-200">
                      <button onClick={() => setQty(p._id, qty - 1)} aria-label="Giảm số lượng" className="flex h-6 w-6 items-center justify-center rounded-full text-espresso-900 hover:bg-cream-100 sm:h-7 sm:w-7">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-semibold text-espresso-950">{qty}</span>
                      <button onClick={() => setQty(p._id, qty + 1)} aria-label="Tăng số lượng" className="flex h-6 w-6 items-center justify-center rounded-full bg-espresso-900 text-cream-50 hover:bg-espresso-800 sm:h-7 sm:w-7">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {lines.length > 0 && (
          <div className="flex justify-between px-1 pb-1 pt-3 text-sm">
            <Link to="/store" className="font-medium text-espresso-700 underline decoration-clay-500/40 underline-offset-4 hover:decoration-clay-500">
              ← Tiếp tục mua sắm
            </Link>
            <button onClick={clear} className="text-espresso-600 hover:text-clay-500">
              Xóa toàn bộ giỏ
            </button>
          </div>
        )}
      </div>

      {/* ===== Tóm tắt + đặt hàng ===== */}
      <aside className="rounded-3xl bg-white p-5 ring-1 ring-cream-200 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold text-espresso-950">Tóm tắt đơn hàng</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-espresso-700">
            <dt>Tạm tính ({count} sản phẩm)</dt>
            <dd>{vnd(total)}</dd>
          </div>
          <div className="flex justify-between text-espresso-700">
            <dt>Phí vận chuyển</dt>
            <dd className="text-right text-xs leading-5">O2O báo khi xác nhận đơn</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-cream-200 pt-3">
            <dt className="font-medium text-espresso-950">Tổng cộng</dt>
            <dd className="font-display text-2xl font-semibold text-espresso-950">{vnd(total)}</dd>
          </div>
        </dl>

        {!admin ? (
          <div className="mt-6">
            <Link
              to={`/login?redirect=${redirectBack}`}
              className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600 py-3 text-sm font-semibold text-espresso-950 transition-all hover:brightness-105"
            >
              Đăng nhập để đặt hàng
            </Link>
            <p className="mt-3 text-center text-xs text-espresso-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-medium text-clay-500 underline underline-offset-2">
                Đăng ký miễn phí
              </Link>
              . Giỏ hàng của bạn sẽ được giữ lại.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-espresso-950">
                <MapPin size={15} className="text-clay-500" /> Giao đến
              </div>

              {addrLoading ? (
                <div className="h-16 animate-pulse rounded-2xl bg-cream-100" />
              ) : adding || addresses.length === 0 ? (
                <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-200">
                  {addresses.length === 0 && <p className="mb-4 text-sm text-espresso-700">Bạn chưa có địa chỉ giao hàng. Thêm một địa chỉ để tiếp tục.</p>}
                  <AddressForm
                    defaultName={admin.name}
                    onSaved={onAddressSaved}
                    onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
                    submitLabel="Lưu & dùng địa chỉ này"
                  />
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {addresses.map((a) => {
                      const active = a._id === selected;
                      return (
                        <li key={a._id}>
                          <button
                            type="button"
                            onClick={() => setSelected(a._id)}
                            className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left text-sm ring-1 transition-colors ${
                              active ? "bg-cream-50 ring-2 ring-espresso-900" : "bg-white ring-cream-200 hover:bg-cream-50"
                            }`}
                          >
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${active ? "bg-espresso-900 text-cream-50" : "ring-1 ring-espresso-600/40"}`}>
                              {active && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium text-espresso-950">
                                {a.fullName} · {a.phone}
                                {a.isDefault && <span className="ml-2 whitespace-nowrap rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Mặc định</span>}
                              </span>
                              <span className="mt-0.5 block text-espresso-700">{[a.line, a.ward, a.district, a.province].filter(Boolean).join(", ")}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" onClick={() => setAdding(true)} className="mt-2 text-sm font-medium text-clay-500 underline underline-offset-4">
                    + Thêm địa chỉ khác
                  </button>
                </>
              )}
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-espresso-950">Hình thức thanh toán</div>
              <div role="radiogroup" aria-label="Hình thức thanh toán" className="space-y-2">
                {[
                  { id: "cod", icon: Banknote, title: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt cho người giao hàng.", disabled: false },
                  {
                    id: "bank_transfer",
                    icon: QrCode,
                    title: "Chuyển khoản online (QR)",
                    desc: !bankAvailable ? "Tạm thời chưa khả dụng." : bankDemo ? "Chế độ demo — chưa có tài khoản nhận tiền thật." : "Quét mã QR ngân hàng — xác nhận tự động trong vài giây.",
                    disabled: !bankAvailable,
                  },
                ].map((m) => {
                  const active = paymentMethod === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={m.disabled}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left ring-1 transition-colors ${
                        active ? "bg-cream-50 ring-2 ring-espresso-900" : "bg-white ring-cream-200 hover:bg-cream-50"
                      } ${m.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? "bg-espresso-900 text-cream-50" : "bg-cream-100 text-espresso-700"}`}>
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-espresso-950">{m.title}</span>
                        <span className="block text-xs text-espresso-600">{m.desc}</span>
                      </span>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${active ? "bg-espresso-900 text-cream-50" : "ring-1 ring-espresso-600/40"}`}>
                        {active && <Check size={11} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Ghi chú cho đơn hàng">
              <textarea
                rows={2}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: logo cần in, giờ nhận hàng…"
                className={inputClass}
              />
            </Field>

            <Notice kind="error">{error}</Notice>

            <button
              onClick={checkout}
              disabled={placing || !selected || adding || lines.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 py-3.5 text-sm font-semibold text-espresso-950 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing && <Loader2 size={16} className="animate-spin" />}
              {placing ? "Đang đặt hàng..." : paymentMethod === "bank_transfer" ? `Đặt hàng & thanh toán · ${vnd(total)}` : `Đặt hàng · ${vnd(total)}`}
            </button>
            <p className="text-center text-xs text-espresso-600">
              {paymentMethod === "bank_transfer" ? "Sau khi đặt, bạn sẽ nhận mã QR để chuyển khoản ngay." : "Bạn trả tiền khi nhận hàng. O2O sẽ liên hệ xác nhận đơn."}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
