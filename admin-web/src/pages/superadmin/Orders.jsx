import { useEffect, useState } from "react";
import { Package, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import { useToast } from "../../components/superadmin/Toast";
import Modal from "../../components/superadmin/Modal";
import { socket } from "../../lib/socket";

const isPaidStatus = (s) => s === "paid" || s === "manual_confirmed";
const METHOD_LABEL = { cod: "COD", bank_transfer: "Chuyển khoản" };
// Nhãn + màu trạng thái thanh toán trên nền tối.
const payBadge = (o) => {
  if (isPaidStatus(o.paymentStatus)) return { label: "Đã thanh toán", cls: "bg-emerald-500/15 text-emerald-400" };
  if (o.paymentStatus === "partial") return { label: "Trả một phần", cls: "bg-amber-500/15 text-amber-400" };
  return { label: o.paymentMethod === "bank_transfer" ? "Chờ tiền về" : "Thu khi giao", cls: "bg-white/8 text-neutral-400" };
};

const STATUS_FLOW = ["pending", "in_production", "uid_loaded", "delivered"];
const STATUS_LABEL = {
  pending: "Chờ xử lý",
  in_production: "Đang sản xuất",
  uid_loaded: "Đã nạp UID chip",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};
const STATUS_COLOR = {
  pending: "bg-amber-500/15 text-amber-400",
  in_production: "bg-blue-500/15 text-blue-400",
  uid_loaded: "bg-emerald-500/15 text-emerald-400",
  delivered: "bg-white/8 text-neutral-500",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function Orders() {
  const toast = useToast();
  const [tab, setTab] = useState("orders"); // 'orders' | 'products'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", type: "Mô hình 3D", priceVnd: "", description: "", imageUrl: "" });

  const loadOrders = () =>
    superAdminApi.get("/super-admin/orders").then((res) => setOrders(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  const loadProducts = () =>
    superAdminApi.get("/super-admin/hardware").then((res) => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});

  useEffect(() => {
    loadOrders();
    loadProducts();
    // Có đơn mới / tiền về (SePay) → danh sách tự cập nhật, không cần tải lại trang.
    const onNotif = (n) => {
      if (n.type !== "order" && n.type !== "payment") return;
      superAdminApi
        .get("/super-admin/orders")
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          setOrders(list);
          setSelectedOrder((cur) => (cur ? list.find((o) => o._id === cur._id) || cur : cur));
        })
        .catch(() => {});
    };
    socket.on("notification:new", onNotif);
    return () => socket.off("notification:new", onNotif);
  }, []);

  // Bọc mọi thao tác: lỗi → toast đỏ (không còn im lặng), thành công → toast xanh
  const run = async (fn, okTitle, okDesc) => {
    try {
      await fn();
      if (okTitle) toast.success(okTitle, okDesc);
    } catch (err) {
      toast.error("Thao tác thất bại", err.response?.data?.message || "Vui lòng thử lại.");
    }
  };

  const advanceStatus = (order) =>
    run(async () => {
      const idx = STATUS_FLOW.indexOf(order.status);
      const next = STATUS_FLOW[idx + 1];
      if (!next) return;
      const assignedUid = next === "uid_loaded" ? prompt("Nhập UID chip gán cho đơn hàng này:") || "" : undefined;
      const res = await superAdminApi.put(`/super-admin/orders/${order._id}/status`, { status: next, assignedUid });
      setOrders((os) => os.map((o) => (o._id === order._id ? res.data : o)));
      setSelectedOrder(res.data);
    }, "Đã chuyển sang bước tiếp theo");

  const cancelOrder = (order) =>
    run(async () => {
      const res = await superAdminApi.put(`/super-admin/orders/${order._id}/status`, { status: "cancelled" });
      setOrders((os) => os.map((o) => (o._id === order._id ? res.data : o)));
      setSelectedOrder(null);
    }, "Đã hủy đơn hàng");

  const confirmPayment = (order) =>
    run(async () => {
      const res = await superAdminApi.put(`/super-admin/orders/${order._id}/confirm-payment`);
      setOrders((os) => os.map((o) => (o._id === order._id ? res.data : o)));
      setSelectedOrder(res.data);
    }, "Đã xác nhận thanh toán");

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.priceVnd) return toast.error("Thiếu thông tin", "Vui lòng nhập tên và giá sản phẩm.");
    return run(async () => {
      const res = await superAdminApi.post("/super-admin/hardware", { ...newProduct, priceVnd: Number(newProduct.priceVnd) });
      setProducts((p) => [...p, res.data]);
      setShowAddProduct(false);
      setNewProduct({ name: "", type: "Mô hình 3D", priceVnd: "", description: "", imageUrl: "" });
    }, "Đã thêm sản phẩm");
  };

  const toggleProductActive = (product) =>
    run(async () => {
      const res = await superAdminApi.put(`/super-admin/hardware/${product._id}`, { isActive: !product.isActive });
      setProducts((p) => p.map((x) => (x._id === product._id ? res.data : x)));
    }, product.isActive ? "Đã ẩn sản phẩm" : "Đã hiển thị sản phẩm");

  const deleteProduct = (product) => {
    if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    return run(async () => {
      await superAdminApi.delete(`/super-admin/hardware/${product._id}`);
      setProducts((p) => p.filter((x) => x._id !== product._id));
    }, "Đã xóa sản phẩm");
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl">
      <h1 className="text-2xl font-semibold text-white">Trung tâm đơn hàng</h1>

      <div className="mt-4 flex gap-2 border-b border-white/10">
        {[
          { key: "orders", label: "Đơn hàng" },
          { key: "products", label: "Sản phẩm" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? "border-orange-500 text-white" : "border-transparent text-neutral-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-5 bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-neutral-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Khách thuê</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Sản phẩm</th>
                <th className="px-5 py-3 font-medium">Tổng tiền</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Thanh toán</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-white/5 cursor-pointer hover:bg-white/5" onClick={() => setSelectedOrder(o)}>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white">{o.tenant?.name}</div>
                    <div className="text-xs text-neutral-500">{o.tenant?.email}</div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-neutral-400">
                    {o.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="px-5 py-3.5 text-white font-medium">{o.totalVnd.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="text-xs text-neutral-400">{METHOD_LABEL[o.paymentMethod] || "COD"}</div>
                    <span className={`mt-1 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${payBadge(o).cls}`}>{payBadge(o).label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-neutral-600">→</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className="px-5 py-10 text-center text-neutral-600 text-sm">Chưa có đơn hàng nào</div>}
        </div>
      )}

      {tab === "products" && (
        <div className="mt-5">
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full"
          >
            <Plus size={16} /> Thêm sản phẩm
          </button>

          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p._id} className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                <div className="flex items-start justify-between">
                  <Package className="text-orange-400" size={22} />
                  <div className="flex gap-1">
                    <button onClick={() => toggleProductActive(p)} className="p-1.5 text-neutral-500 hover:text-white">
                      {p.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => deleteProduct(p)} className="p-1.5 text-neutral-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-white mt-3">{p.name}</h3>
                <p className="text-xs text-neutral-500">{p.type}</p>
                <p className="text-sm font-medium text-white mt-2">{p.priceVnd.toLocaleString("vi-VN")}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <Modal title="Chi tiết đơn hàng" onClose={() => setSelectedOrder(null)}>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-neutral-500">Khách thuê: </span>
              <span className="font-medium text-white">{selectedOrder.tenant?.name} ({selectedOrder.tenant?.email})</span>
            </div>
            <div>
              <span className="text-neutral-500">Địa chỉ giao: </span>
              {selectedOrder.shippingAddress || "Chưa cung cấp"}
            </div>
            {selectedOrder.note && (
              <div>
                <span className="text-neutral-500">Ghi chú: </span>
                {selectedOrder.note}
              </div>
            )}
            <div className="border-t border-white/5 pt-3">
              {selectedOrder.items.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span>{i.name} × {i.qty}</span>
                  <span>{(i.priceVnd * i.qty).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-2 border-t border-white/5 mt-2">
                <span>Tổng</span>
                <span>{selectedOrder.totalVnd.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
            {selectedOrder.assignedUid && (
              <div>
                <span className="text-neutral-500">UID chip đã gán: </span>
                <span className="font-mono">{selectedOrder.assignedUid}</span>
              </div>
            )}
            <div className="space-y-1">
              <div>
                <span className="text-neutral-500">Hình thức: </span>
                <span className="font-medium">{selectedOrder.paymentMethod === "bank_transfer" ? "Chuyển khoản online (SePay)" : "Thanh toán khi nhận hàng (COD)"}</span>
              </div>
              {selectedOrder.paymentCode && (
                <div>
                  <span className="text-neutral-500">Mã thanh toán: </span>
                  <span className="font-mono">{selectedOrder.paymentCode}</span>
                </div>
              )}
              <div>
                <span className="text-neutral-500">Trạng thái: </span>
                <span className={`font-medium ${isPaidStatus(selectedOrder.paymentStatus) ? "text-emerald-400" : "text-amber-400"}`}>
                  {selectedOrder.paymentStatus === "paid"
                    ? "Đã nhận tiền (SePay tự động)"
                    : selectedOrder.paymentStatus === "manual_confirmed"
                    ? "Đã xác nhận (thủ công)"
                    : selectedOrder.paymentStatus === "partial"
                    ? "Mới nhận một phần"
                    : "Chưa thanh toán"}
                </span>
              </div>
              {(selectedOrder.paidVnd > 0 || selectedOrder.paymentStatus === "partial") && (
                <div>
                  <span className="text-neutral-500">Đã nhận: </span>
                  {selectedOrder.paidVnd.toLocaleString("vi-VN")}đ / {selectedOrder.totalVnd.toLocaleString("vi-VN")}đ
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!isPaidStatus(selectedOrder.paymentStatus) && selectedOrder.status !== "cancelled" && (
              <button onClick={() => confirmPayment(selectedOrder)} className="text-xs font-medium bg-amber-500 text-white px-3 py-2 rounded-full">
                {selectedOrder.paymentMethod === "bank_transfer" ? "Xác nhận đã nhận tiền (thủ công)" : "Xác nhận đã thu tiền COD"}
              </button>
            )}
            {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
              <button onClick={() => advanceStatus(selectedOrder)} className="text-xs font-medium bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-full">
                Chuyển sang: {STATUS_LABEL[STATUS_FLOW[STATUS_FLOW.indexOf(selectedOrder.status) + 1]]}
              </button>
            )}
            {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
              <button onClick={() => cancelOrder(selectedOrder)} className="text-xs font-medium bg-red-500/15 text-red-400 px-3 py-2 rounded-full">
                Hủy đơn
              </button>
            )}
          </div>
        </Modal>
      )}

      {showAddProduct && (
        <Modal title="Thêm sản phẩm mới" onClose={() => setShowAddProduct(false)}>
          <div className="space-y-3">
            <input
              placeholder="Tên sản phẩm"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <input
              placeholder="Loại (vd: Mô hình 3D, Biển gỗ...)"
              value={newProduct.type}
              onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <input
              type="number"
              placeholder="Giá (VNĐ)"
              value={newProduct.priceVnd}
              onChange={(e) => setNewProduct({ ...newProduct, priceVnd: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <input
              placeholder="URL ảnh (tùy chọn)"
              value={newProduct.imageUrl}
              onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <textarea
              placeholder="Mô tả"
              rows={3}
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <button onClick={handleAddProduct} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 rounded-xl text-sm font-medium">
              Thêm sản phẩm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
