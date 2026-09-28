import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, Lock, Minus, PackageOpen, Plus, ShoppingBag, XCircle } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../lib/socket";
import { RevealWords, Spotlight } from "../../components/public/fx";

const TABS = [
  { id: "plans", label: "Gói dịch vụ" },
  { id: "shop", label: "Vật phẩm decor" },
];

const reveal = (i = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.08 },
});

export default function PublicStore() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [hardwareLoading, setHardwareLoading] = useState(true);
  const [cart, setCart] = useState({}); // { productId: qty }
  const [placing, setPlacing] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");
  const [orderOk, setOrderOk] = useState(false);
  const [tab, setTab] = useState("plans");

  const loadPlans = () =>
    api.get("/public/plans").then((res) => setPlans(res.data)).catch(() => {}).finally(() => setPlansLoading(false));
  const loadHardware = () =>
    api.get("/public/hardware").then((res) => setHardware(res.data)).catch(() => {}).finally(() => setHardwareLoading(false));

  useEffect(() => {
    loadPlans();
    loadHardware();
    // Super Admin đổi giá/sản phẩm ở đâu đó → trang này tự cập nhật ngay, không cần tải lại.
    socket.on("plan:updated", loadPlans);
    socket.on("hardware:updated", loadHardware);
    return () => {
      socket.off("plan:updated", loadPlans);
      socket.off("hardware:updated", loadHardware);
    };
  }, []);

  // Tab đang xem tự đổi theo vị trí cuộn.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setTab(e.target.id)),
      { rootMargin: "-35% 0px -55% 0px" }
    );
    TABS.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Thông báo đặt hàng tự tắt sau vài giây.
  useEffect(() => {
    if (!orderMsg) return;
    const t = setTimeout(() => setOrderMsg(""), 7000);
    return () => clearTimeout(t);
  }, [orderMsg]);

  const setQty = (id, qty) => setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));

  const cartItems = hardware
    .filter((p) => cart[p._id] > 0)
    .map((p) => ({ product: p, qty: cart[p._id] }));
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.priceVnd * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const handlePlanSelect = (planKey) => {
    if (admin) {
      // đã có tài khoản — đổi gói ngay trong Admin Dashboard thật (Client Web), không phải ở đây
      window.location.href = `${import.meta.env.VITE_CLIENT_WEB_URL || "http://localhost:5173"}/admin/store?token=${localStorage.getItem("o2o_token") || ""}`;
    } else {
      navigate(`/register?plan=${planKey}`);
    }
  };

  const handleOrder = async () => {
    if (!admin) {
      navigate("/login?redirect=/store");
      return;
    }
    setPlacing(true);
    setOrderMsg("");
    try {
      await api.post("/orders", {
        items: cartItems.map((i) => ({ productId: i.product._id, qty: i.qty })),
      });
      setCart({});
      setOrderOk(true);
      setOrderMsg("Đặt hàng thành công! Đội ngũ O2O sẽ liên hệ xác nhận sớm nhất.");
    } catch (err) {
      setOrderOk(false);
      setOrderMsg(err.response?.data?.message || "Không thể đặt hàng, vui lòng thử lại");
    } finally {
      setPlacing(false);
    }
  };

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div>
      {/* ===== Đầu trang ===== */}
      <header className="relative overflow-x-clip bg-paper-dots px-5 pb-6 pt-16 text-center md:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-sage-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <RevealWords
            text="Bảng giá đơn giản, minh bạch"
            className="font-display text-[2.4rem] font-semibold leading-[1.06] tracking-[-0.02em] text-espresso-950 sm:text-6xl"
          />
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-5 text-lg text-espresso-700"
          >
            Bắt đầu miễn phí, nâng cấp khi bạn cần thêm tính năng.
          </motion.p>
        </div>
      </header>

      {/* ===== Thanh chuyển tab (dính dưới navbar) ===== */}
      <div className="sticky top-16 z-30 flex justify-center px-5 py-3">
        <div className="flex gap-1 rounded-full bg-cream-50/75 p-1 shadow-[0_10px_30px_-14px_rgba(59,35,24,0.45)] ring-1 ring-espresso-900/10 backdrop-blur-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => goTo(t.id)}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "text-cream-50" : "text-espresso-700 hover:text-espresso-950"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="store-tab"
                  className="absolute inset-0 rounded-full bg-espresso-900"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {t.label}
                {t.id === "shop" && cartCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-semibold text-espresso-950">
                    {cartCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Bảng giá ===== */}
      <section id="plans" className="mx-auto max-w-6xl scroll-mt-32 px-5 pb-28 pt-10 md:pb-32">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {plansLoading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[26rem] animate-pulse rounded-3xl bg-cream-100" />)
            : plans.map((plan, i) => <PlanCard key={plan._id} plan={plan} index={i} onSelect={handlePlanSelect} />)}
        </div>
      </section>

      {/* ===== Cửa hàng phần cứng ===== */}
      <section id="shop" className="relative -mt-8 scroll-mt-32 rounded-t-[2.5rem] bg-stage-dark pb-40 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-cream-50 sm:text-5xl">Cửa hàng vật phẩm decor</h2>
              <p className="mt-4 text-cream-100/70">Vật phẩm gắn sẵn chip NFC + mã QR, sẵn sàng đặt lên bàn ngay khi nhận hàng.</p>
            </div>
            {!admin && (
              <div className="flex items-center gap-2 rounded-full bg-cream-50/10 px-4 py-2 text-sm text-cream-100/80 ring-1 ring-cream-50/10">
                <Lock size={14} /> Cần đăng nhập để đặt hàng
              </div>
            )}
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hardwareLoading &&
              [0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-cream-50/[0.06]" />)}
            {!hardwareLoading &&
              hardware.map((p, i) => (
                <ProductCard key={p._id} p={p} i={i} qty={cart[p._id] || 0} setQty={(q) => setQty(p._id, q)} />
              ))}
          </div>

          {!hardwareLoading && hardware.length === 0 && (
            <div className="mt-6 flex flex-col items-center rounded-3xl bg-cream-50/[0.05] py-16 text-center ring-1 ring-cream-50/10">
              <PackageOpen size={36} className="text-amber-400/70" />
              <p className="mt-4 font-display text-xl text-cream-50">Vật phẩm đang được cập nhật</p>
              <p className="mt-1 text-sm text-cream-100/60">Vui lòng quay lại sau hoặc liên hệ để được tư vấn.</p>
            </div>
          )}

          {!admin && (
            <p className="mt-8 text-sm text-cream-100/60">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-medium text-amber-400 underline underline-offset-2">
                Đăng ký miễn phí
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ===== Giỏ hàng nổi ===== */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 110, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 110, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl"
          >
            <div className="flex items-center justify-between gap-4 rounded-full bg-espresso-950/90 py-2.5 pl-6 pr-2.5 text-cream-50 shadow-[0_26px_60px_-20px_rgba(0,0,0,0.75)] ring-1 ring-cream-50/15 backdrop-blur-xl">
              <div>
                <div className="text-xs text-cream-100/60">{cartCount} sản phẩm</div>
                <div className="font-display text-lg font-semibold leading-tight">{cartTotal.toLocaleString("vi-VN")}đ</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCart({})} className="px-3 text-sm text-cream-100/60 transition-colors hover:text-cream-50">
                  Xoá
                </button>
                <button
                  onClick={handleOrder}
                  disabled={placing}
                  className="rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-6 py-3 text-sm font-semibold text-espresso-950 transition-all hover:brightness-105 disabled:opacity-60"
                >
                  {placing ? "Đang đặt hàng..." : admin ? "Đặt hàng" : "Đăng nhập để đặt hàng"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Thông báo kết quả đặt hàng ===== */}
      <AnimatePresence>
        {orderMsg && (
          <motion.div
            role="status"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md"
          >
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm shadow-2xl ring-1 backdrop-blur-xl ${
                orderOk ? "bg-espresso-950/95 text-cream-50 ring-sage-400/40" : "bg-espresso-950/95 text-cream-50 ring-clay-500/50"
              }`}
            >
              {orderOk ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-sage-400" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-clay-500" />}
              <p className="flex-1">{orderMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanCard({ plan, index, onSelect }) {
  const popular = plan.planKey === "level2";
  const free = plan.priceVnd === 0;

  const body = (
    <Spotlight className="flex h-full flex-col rounded-[22px] bg-white p-6">
      {popular && <span className="mb-3 w-fit rounded-full bg-clay-500/10 px-3 py-1 text-xs font-medium text-clay-500">Phổ biến nhất</span>}
      <h3 className="font-display text-xl font-semibold text-espresso-950">{plan.name}</h3>
      <div className="mt-3 font-display text-3xl font-semibold tracking-tight text-espresso-950">
        {free ? "Miễn phí" : plan.priceLabel || `${plan.priceVnd.toLocaleString("vi-VN")}đ/tháng`}
      </div>
      <p className="mt-1 text-sm text-espresso-600">{plan.tagline}</p>
      <div className="my-5 h-px bg-gradient-to-r from-cream-200 to-transparent" />
      <ul className="flex-1 space-y-3">
        {(plan.features || []).map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-espresso-700">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-500/15 text-sage-500">
              <Check size={11} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(plan.planKey)}
        className={`mt-7 w-full rounded-full py-3 font-medium transition-all ${
          popular
            ? "bg-espresso-900 text-cream-50 shadow-[0_14px_28px_-14px_rgba(42,24,16,0.8)] hover:bg-espresso-800"
            : "bg-cream-100 text-espresso-900 hover:bg-cream-200"
        }`}
      >
        {free ? "Bắt đầu miễn phí" : "Chọn gói này"}
      </button>
    </Spotlight>
  );

  return (
    <motion.div {...reveal(index)} className={popular ? "lg:-my-3" : ""}>
      {popular ? (
        // Viền gradient xoay quanh thẻ "Phổ biến nhất"
        <div className="relative h-full overflow-hidden rounded-3xl p-[2px] shadow-[0_34px_60px_-30px_rgba(184,86,47,0.6)]">
          <span
            aria-hidden="true"
            className="animate-spin-slow absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0deg,#D4A24C_110deg,#B8562F_170deg,transparent_240deg)]"
          />
          <div className="relative h-full">{body}</div>
        </div>
      ) : (
        <div className="h-full rounded-3xl ring-1 ring-cream-200 transition-transform duration-300 hover:-translate-y-1.5">{body}</div>
      )}
    </motion.div>
  );
}

function ProductCard({ p, i, qty, setQty }) {
  return (
    <motion.div
      {...reveal(i)}
      className="group flex flex-col overflow-hidden rounded-3xl bg-cream-50/[0.06] ring-1 ring-cream-50/10 transition-colors hover:bg-cream-50/[0.1]"
    >
      <div className="relative h-52 overflow-hidden">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-espresso-700 to-espresso-900">
            <ShoppingBag className="text-amber-400/50" size={44} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/60 via-transparent to-transparent" />
        {p.type && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso-950/70 px-3 py-1 text-xs font-medium text-amber-400 backdrop-blur">{p.type}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold text-cream-50">{p.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-cream-100/65">{p.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="font-display text-xl font-semibold text-cream-50">{p.priceVnd.toLocaleString("vi-VN")}đ</span>
          {qty === 0 ? (
            <button
              onClick={() => setQty(1)}
              className="flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-espresso-950 transition-all hover:bg-amber-400/90 active:scale-95"
            >
              <Plus size={15} strokeWidth={2.6} /> Thêm
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-cream-50/10 p-1 ring-1 ring-cream-50/15">
              <button onClick={() => setQty(qty - 1)} aria-label="Giảm số lượng" className="flex h-8 w-8 items-center justify-center rounded-full text-cream-50 transition-colors hover:bg-cream-50/15">
                <Minus size={14} />
              </button>
              <div className="relative flex h-8 w-7 items-center justify-center overflow-hidden text-sm font-semibold text-cream-50">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={qty}
                    initial={{ y: -14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 14, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {qty}
                  </motion.span>
                </AnimatePresence>
              </div>
              <button onClick={() => setQty(qty + 1)} aria-label="Tăng số lượng" className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-espresso-950 transition-transform active:scale-90">
                <Plus size={14} strokeWidth={2.6} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
