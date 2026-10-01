import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { socket } from "../lib/socket";
import { useAuth } from "./AuthContext";

// Giỏ hàng dùng chung cho toàn bộ trang công khai (Store, Giỏ hàng, Tài khoản).
//
// • Khách chưa đăng nhập: giỏ lưu ở localStorage (chọn hàng thoải mái rồi mới đăng nhập, không mất giỏ).
// • Khách đã đăng nhập: giỏ được lưu thêm trên server (collection CustomerProfile) → mở ở thiết bị khác vẫn thấy.
//   Lúc đăng nhập, giỏ vãng lai được GỘP vào giỏ trên server (lấy số lượng lớn hơn của từng sản phẩm).
// • Đăng xuất: xoá giỏ trên máy này (giỏ trên server vẫn còn cho lần đăng nhập sau) — an toàn khi dùng máy chung.
const KEY = "o2o_cart_v1"; // { owner: adminId | null, items: { [productId]: qty } }

const readLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && typeof raw === "object" && raw.items && typeof raw.items === "object") return { owner: raw.owner || null, items: raw.items };
  } catch {
    /* dữ liệu hỏng → coi như giỏ trống */
  }
  return { owner: null, items: {} };
};
const writeLocal = (data) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* localStorage đầy/bị chặn — giỏ vẫn hoạt động trong phiên */
  }
};

const clampQty = (n) => Math.max(0, Math.min(99, Math.floor(Number(n) || 0)));
const toPayload = (map) => Object.entries(map).map(([productId, qty]) => ({ productId, qty }));

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { admin, loading: authLoading } = useAuth();
  const [qtys, setQtys] = useState(() => readLocal().items);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const qtysRef = useRef(qtys);
  const ownerRef = useRef(null); // chỉ được gán SAU khi đồng bộ xong với server
  const timer = useRef(null);

  // ---- Danh mục sản phẩm (để có tên/giá/ảnh cho từng dòng trong giỏ) — tự cập nhật khi Super Admin đổi giá ----
  useEffect(() => {
    const load = () =>
      api
        .get("/public/hardware")
        .then((res) => setCatalog(res.data))
        .catch(() => {})
        .finally(() => setCatalogLoading(false));
    load();
    socket.on("hardware:updated", load);
    return () => socket.off("hardware:updated", load);
  }, []);

  const applyMap = useCallback((map, owner) => {
    qtysRef.current = map;
    setQtys(map);
    writeLocal({ owner, items: map });
  }, []);

  // ---- Đồng bộ theo trạng thái đăng nhập ----
  useEffect(() => {
    if (authLoading) return;
    clearTimeout(timer.current);

    if (!admin?._id) {
      // Khách vãng lai. Nếu vừa đăng xuất (giỏ còn thuộc về 1 tài khoản) → dọn sạch.
      ownerRef.current = null;
      const local = readLocal();
      if (local.owner) applyMap({}, null);
      return;
    }

    let cancelled = false;
    api
      .get("/customer/cart")
      .then((res) => {
        if (cancelled) return;
        const server = {};
        res.data.forEach((l) => (server[l.product._id] = clampQty(l.qty)));
        const local = readLocal();

        let merged = server;
        let needPush = false;
        if (!local.owner) {
          // Giỏ vãng lai → gộp vào giỏ của tài khoản.
          merged = { ...server };
          Object.entries(local.items).forEach(([id, q]) => {
            merged[id] = Math.max(merged[id] || 0, clampQty(q));
          });
          needPush = Object.keys(local.items).length > 0;
        }
        ownerRef.current = admin._id;
        applyMap(merged, admin._id);
        if (needPush) api.put("/customer/cart", { items: toPayload(merged) }).catch(() => {});
      })
      .catch(() => {
        // Server chưa sẵn sàng: vẫn dùng giỏ trên máy, thử đồng bộ ở lần thay đổi kế tiếp.
        if (cancelled) return;
        ownerRef.current = admin._id;
      });
    return () => {
      cancelled = true;
    };
  }, [admin?._id, authLoading, applyMap]);

  // ---- Thay đổi giỏ: cập nhật ngay trên máy, đẩy lên server sau 400ms (gộp nhiều lần bấm liên tiếp) ----
  const update = useCallback(
    (fn) => {
      const next = fn({ ...qtysRef.current });
      Object.keys(next).forEach((id) => {
        next[id] = clampQty(next[id]);
        if (next[id] === 0) delete next[id];
      });
      applyMap(next, ownerRef.current);
      if (ownerRef.current) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          api.put("/customer/cart", { items: toPayload(qtysRef.current) }).catch(() => {});
        }, 400);
      }
    },
    [applyMap]
  );

  const setQty = useCallback((id, qty) => update((m) => ({ ...m, [id]: qty })), [update]);
  const add = useCallback((id) => update((m) => ({ ...m, [id]: (m[id] || 0) + 1 })), [update]);
  const remove = useCallback((id) => update((m) => (delete m[id], m)), [update]);
  const clear = useCallback(() => update(() => ({})), [update]);

  const lines = useMemo(
    () => catalog.filter((p) => qtys[p._id] > 0).map((p) => ({ product: p, qty: qtys[p._id] })),
    [catalog, qtys]
  );
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.product.priceVnd * l.qty, 0), [lines]);

  // Đặt hàng: gửi các dòng đang có trong giỏ + địa chỉ + hình thức thanh toán ("cod" | "bank_transfer"). Thành công → dọn giỏ.
  // Đơn chuyển khoản trả kèm `payment` (QR SePay, số tài khoản, nội dung chuyển khoản).
  const placeOrder = useCallback(
    async ({ addressId, shipping, note, paymentMethod = "cod" }) => {
      const res = await api.post("/orders", {
        items: lines.map((l) => ({ productId: l.product._id, qty: l.qty })),
        addressId,
        shipping,
        note,
        paymentMethod,
      });
      clear();
      return res.data;
    },
    [lines, clear]
  );

  const value = useMemo(
    () => ({ catalog, catalogLoading, lines, count, total, qtyOf: (id) => qtys[id] || 0, setQty, add, remove, clear, placeOrder }),
    [catalog, catalogLoading, lines, count, total, qtys, setQty, add, remove, clear, placeOrder]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
