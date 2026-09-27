import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, ShoppingBag, Minus, Plus, Lock } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../lib/socket";

export default function PublicStore() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [cart, setCart] = useState({}); // { productId: qty }
  const [placing, setPlacing] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");

  const loadPlans = () => api.get("/public/plans").then((res) => setPlans(res.data)).catch(() => {});
  const loadHardware = () => api.get("/public/hardware").then((res) => setHardware(res.data)).catch(() => {});

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

  const setQty = (id, qty) => setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));

  const cartItems = hardware
    .filter((p) => cart[p._id] > 0)
    .map((p) => ({ product: p, qty: cart[p._id] }));
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.priceVnd * i.qty, 0);

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
      setOrderMsg("Đặt hàng thành công! Đội ngũ O2O sẽ liên hệ xác nhận sớm nhất.");
    } catch (err) {
      setOrderMsg(err.response?.data?.message || "Không thể đặt hàng, vui lòng thử lại");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      {/* ===== Bảng giá ===== */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-espresso-950">Bảng giá đơn giản, minh bạch</h1>
          <p className="mt-3 text-espresso-700">Bắt đầu miễn phí, nâng cấp khi bạn cần thêm tính năng.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`rounded-2xl p-6 border flex flex-col ${
                plan.planKey === "level2" ? "border-clay-500 bg-white shadow-lg shadow-clay-500/10 scale-[1.02]" : "border-cream-200 bg-white"
              }`}
            >
              {plan.planKey === "level2" && (
                <span className="text-xs font-medium text-clay-500 bg-clay-500/10 rounded-full px-3 py-1 w-fit mb-3">Phổ biến nhất</span>
              )}
              <h3 className="font-display text-xl font-semibold text-espresso-950">{plan.name}</h3>
              <div className="mt-2 font-display text-2xl font-semibold text-espresso-950">
                {plan.priceVnd === 0 ? "Miễn phí" : plan.priceLabel || `${plan.priceVnd.toLocaleString("vi-VN")}đ/tháng`}
              </div>
              <p className="text-sm text-espresso-600 mt-1">{plan.tagline}</p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {(plan.features || []).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-espresso-700">
                    <Check size={16} className="text-sage-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanSelect(plan.planKey)}
                className={`mt-6 w-full py-2.5 rounded-full font-medium transition-colors ${
                  plan.planKey === "level2"
                    ? "bg-espresso-900 text-cream-50 hover:bg-espresso-800"
                    : "bg-cream-100 text-espresso-900 hover:bg-cream-200"
                }`}
              >
                {plan.priceVnd === 0 ? "Bắt đầu miễn phí" : "Chọn gói này"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Cửa hàng phần cứng ===== */}
      <section className="bg-cream-100 border-t border-cream-200">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-espresso-950">Cửa hàng vật phẩm decor</h2>
              <p className="text-espresso-700 mt-2">Vật phẩm gắn sẵn chip NFC + mã QR, sẵn sàng đặt lên bàn ngay khi nhận hàng.</p>
            </div>
            {!admin && (
              <div className="flex items-center gap-2 text-sm text-espresso-600 bg-white border border-cream-200 rounded-full px-4 py-2">
                <Lock size={14} /> Cần đăng nhập để đặt hàng
              </div>
            )}
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hardware.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl border border-cream-200 overflow-hidden flex flex-col">
                <div className="h-40 bg-cream-200 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="text-espresso-600/40" size={40} />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs font-medium text-clay-500">{p.type}</span>
                  <h3 className="font-display text-lg font-semibold text-espresso-950 mt-1">{p.name}</h3>
                  <p className="text-sm text-espresso-600 mt-1.5 flex-1">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold text-espresso-950">{p.priceVnd.toLocaleString("vi-VN")}đ</span>
                    <div className="flex items-center gap-2 border border-cream-200 rounded-full px-1">
                      <button onClick={() => setQty(p._id, (cart[p._id] || 0) - 1)} className="p-1.5 text-espresso-700 hover:text-espresso-900">
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{cart[p._id] || 0}</span>
                      <button onClick={() => setQty(p._id, (cart[p._id] || 0) + 1)} className="p-1.5 text-espresso-700 hover:text-espresso-900">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cartItems.length > 0 && (
            <div className="mt-10 bg-white border border-cream-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-espresso-600">{cartItems.reduce((s, i) => s + i.qty, 0)} sản phẩm</div>
                <div className="font-display text-xl font-semibold text-espresso-950">{cartTotal.toLocaleString("vi-VN")}đ</div>
              </div>
              <button
                onClick={handleOrder}
                disabled={placing}
                className="bg-espresso-900 text-cream-50 px-6 py-3 rounded-full font-medium hover:bg-espresso-800 transition-colors disabled:opacity-60"
              >
                {placing ? "Đang đặt hàng..." : admin ? "Đặt hàng" : "Đăng nhập để đặt hàng"}
              </button>
            </div>
          )}
          {orderMsg && <p className="mt-4 text-sm text-espresso-700">{orderMsg}</p>}
          {!admin && (
            <p className="mt-4 text-sm text-espresso-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-clay-500 font-medium underline underline-offset-2">
                Đăng ký miễn phí
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
