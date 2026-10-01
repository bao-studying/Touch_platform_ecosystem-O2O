import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock, Minus, PackageOpen, Plus, ShoppingBag } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { CLIENT_WEB_URL } from "../../lib/config";
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
  const [plansLoading, setPlansLoading] = useState(true);
  const [tab, setTab] = useState("plans");
  // Giỏ hàng + danh mục vật phẩm nằm ở CartContext — dùng chung với trang /cart và Tài khoản, giữ nguyên khi chuyển trang.
  const { catalog: hardware, catalogLoading: hardwareLoading, qtyOf, setQty, count: cartCount, total: cartTotal } = useCart();

  const loadPlans = () =>
    api.get("/public/plans").then((res) => setPlans(res.data)).catch(() => {}).finally(() => setPlansLoading(false));

  useEffect(() => {
    loadPlans();
    // Super Admin đổi giá gói ở đâu đó → trang này tự cập nhật ngay, không cần tải lại (giá vật phẩm do CartContext lo).
    socket.on("plan:updated", loadPlans);
    return () => socket.off("plan:updated", loadPlans);
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

  const handlePlanSelect = (planKey) => {
    if (admin) {
      // đã có tài khoản — đổi gói ngay trong Admin Dashboard thật (Client Web), không phải ở đây
      window.location.href = `${CLIENT_WEB_URL}/admin/store?token=${localStorage.getItem("o2o_token") || ""}`;
    } else {
      navigate(`/register?plan=${planKey}`);
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

          <div className="mt-12 grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {hardwareLoading &&
              [0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-cream-50/[0.06]" />)}
            {!hardwareLoading &&
              hardware.map((p, i) => (
                <ProductCard key={p._id} p={p} i={i} qty={qtyOf(p._id)} setQty={(q) => setQty(p._id, q)} />
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

      {/* ===== Giỏ hàng nổi — bấm để xem giỏ / đặt hàng ở trang /cart ===== */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 110, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 110, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 bottom-[calc(var(--bottom-nav-h)+0.75rem)] z-50 mx-auto max-w-xl md:bottom-4"
          >
            <div className="flex items-center justify-between gap-4 rounded-full bg-espresso-950/90 py-2.5 pl-6 pr-2.5 text-cream-50 shadow-[0_26px_60px_-20px_rgba(0,0,0,0.75)] ring-1 ring-cream-50/15 backdrop-blur-xl">
              <div>
                <div className="text-xs text-cream-100/60">{cartCount} sản phẩm</div>
                <div className="font-display text-lg font-semibold leading-tight">{cartTotal.toLocaleString("vi-VN")}đ</div>
              </div>
              <Link
                to="/cart"
                className="rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-6 py-3 text-sm font-semibold text-espresso-950 transition-all hover:brightness-105"
              >
                Xem giỏ hàng
              </Link>
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

// Thẻ sản phẩm: trên mobile thu gọn để 1 hàng hiện 3 thẻ (ảnh vuông, tên, giá, nút thêm); từ màn hình sm trở lên hiện đầy đủ mô tả.
function ProductCard({ p, i, qty, setQty }) {
  return (
    <motion.div
      {...reveal(i)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-cream-50/[0.06] ring-1 ring-cream-50/10 transition-colors hover:bg-cream-50/[0.1] sm:rounded-3xl"
    >
      <div className="relative aspect-square overflow-hidden sm:aspect-auto sm:h-52">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-espresso-700 to-espresso-900">
            <ShoppingBag className="text-amber-400/50" size={30} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/60 via-transparent to-transparent" />
        {p.type && (
          <span className="absolute left-3 top-3 hidden rounded-full bg-espresso-950/70 px-3 py-1 text-xs font-medium text-amber-400 backdrop-blur sm:inline-flex">{p.type}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2 sm:p-5">
        <h3 className="line-clamp-2 font-display text-[12px] font-semibold leading-tight text-cream-50 sm:line-clamp-none sm:text-xl">{p.name}</h3>
        <p className="mt-2 hidden flex-1 text-sm leading-relaxed text-cream-100/65 sm:block">{p.description}</p>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-0">
          <span className="font-display text-[13px] font-semibold text-cream-50 sm:text-xl">{p.priceVnd.toLocaleString("vi-VN")}đ</span>
          {qty === 0 ? (
            <button
              onClick={() => setQty(1)}
              aria-label={`Thêm ${p.name} vào giỏ`}
              className="flex w-full items-center justify-center gap-1 rounded-full bg-amber-400 py-1.5 text-xs font-semibold text-espresso-950 transition-all hover:bg-amber-400/90 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Plus size={14} strokeWidth={2.6} /> Thêm
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-full bg-cream-50/10 p-0.5 ring-1 ring-cream-50/15 sm:justify-start sm:gap-1 sm:p-1">
              <button onClick={() => setQty(qty - 1)} aria-label="Giảm số lượng" className="flex h-7 w-7 items-center justify-center rounded-full text-cream-50 transition-colors hover:bg-cream-50/15 sm:h-8 sm:w-8">
                <Minus size={13} />
              </button>
              <div className="relative flex h-7 w-5 items-center justify-center overflow-hidden text-sm font-semibold text-cream-50 sm:h-8 sm:w-7">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={qty} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={{ duration: 0.18 }}>
                    {qty}
                  </motion.span>
                </AnimatePresence>
              </div>
              <button onClick={() => setQty(qty + 1)} aria-label="Tăng số lượng" className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-espresso-950 transition-transform active:scale-90 sm:h-8 sm:w-8">
                <Plus size={13} strokeWidth={2.6} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
