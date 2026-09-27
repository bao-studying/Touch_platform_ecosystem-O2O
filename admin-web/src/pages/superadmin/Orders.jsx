import { useEffect, useState } from "react";
import { Package, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import Modal from "../../components/superadmin/Modal";

const STATUS_FLOW = ["pending", "in_production", "uid_loaded", "delivered"];
const STATUS_LABEL = {
  pending: "Chờ xử lý",
  in_production: "Đang sản xuất",
  uid_loaded: "Đã nạp UID chip",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};
const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-700",
  in_production: "bg-blue-600/10 text-indigo-600",
  uid_loaded: "bg-emerald-50 text-emerald-600",
  delivered: "bg-slate-200/80 text-slate-500",
  cancelled: "bg-red-50 text-red-600",
};

export default function Orders() {
  const [tab, setTab] = useState("orders"); // 'orders' | 'products'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", type: "Mô hình 3D", priceVnd: "", description: "", imageUrl: "" });

  const loadOrders = () => superAdminApi.get("/super-admin/orders").then((res) => setOrders(res.data));
  const loadProducts = () => superAdminApi.get("/super-admin/hardware").then((res) => setProducts(res.data));

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const advanceStatus = async (order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    const assignedUid = next === "uid_loaded" ? prompt("Nhập UID chip gán cho đơn hàng này:") || "" : undefined;
    const res = await superAdminApi.put(`/super-admin/orders/${order._id}/status`, { status: next, assignedUid });
    setOrders((os) => os.map((o) => (o._id === order._id ? res.data : o)));
    setSelectedOrder(res.data);
  };

  const cancelOrder = async (order) => {
    const res = await superAdminApi.put(`/super-admin/orders/${order._id}/status`, { status: "cancelled" });
    setOrders((os) => os.map((o) => (o._id === order._id ? res.data : o)));
    setSelectedOrder(null);
  };

  const confirmPayment = async (order) => {
    const res = await superAdminApi.put(`/super-admin/orders/${order._id}/confirm-payment`);
    setOrders((os) => os.map((o) => (o._id === order._id ? res.data : o)));
    setSelectedOrder(res.data);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.priceVnd) return;
    const res = await superAdminApi.post("/super-admin/hardware", { ...newProduct, priceVnd: Number(newProduct.priceVnd) });
    setProducts((p) => [...p, res.data]);
    setShowAddProduct(false);
    setNewProduct({ name: "", type: "Mô hình 3D", priceVnd: "", description: "", imageUrl: "" });
  };

  const toggleProductActive = async (product) => {
    const res = await superAdminApi.put(`/super-admin/hardware/${product._id}`, { isActive: !product.isActive });
    setProducts((p) => p.map((x) => (x._id === product._id ? res.data : x)));
  };

  const deleteProduct = async (product) => {
    if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    await superAdminApi.delete(`/super-admin/hardware/${product._id}`);
    setProducts((p) => p.filter((x) => x._id !== product._id));
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl">
      <h1 className="text-2xl font-semibold text-slate-900">Trung tâm đơn hàng</h1>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
        {[
          { key: "orders", label: "Đơn hàng" },
          { key: "products", label: "Sản phẩm" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? "border-blue-600 text-slate-900" : "border-transparent text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-5 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Khách thuê</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Sản phẩm</th>
                <th className="px-5 py-3 font-medium">Tổng tiền</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-slate-200/80 cursor-pointer hover:bg-slate-50/50" onClick={() => setSelectedOrder(o)}>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{o.tenant?.name}</div>
                    <div className="text-xs text-slate-500">{o.tenant?.email}</div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-slate-600">
                    {o.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-900 font-medium">{o.totalVnd.toLocaleString("vi-VN")}đ</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-400">→</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className="px-5 py-10 text-center text-slate-400 text-sm">Chưa có đơn hàng nào</div>}
        </div>
      )}

      {tab === "products" && (
        <div className="mt-5">
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full"
          >
            <Plus size={16} /> Thêm sản phẩm
          </button>

          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl border border-slate-200/80 p-5">
                <div className="flex items-start justify-between">
                  <Package className="text-blue-600" size={22} />
                  <div className="flex gap-1">
                    <button onClick={() => toggleProductActive(p)} className="p-1.5 text-slate-500 hover:text-slate-800">
                      {p.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => deleteProduct(p)} className="p-1.5 text-slate-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-slate-900 mt-3">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.type}</p>
                <p className="text-sm font-medium text-slate-900 mt-2">{p.priceVnd.toLocaleString("vi-VN")}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <Modal title="Chi tiết đơn hàng" onClose={() => setSelectedOrder(null)}>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Khách thuê: </span>
              <span className="font-medium text-slate-900">{selectedOrder.tenant?.name} ({selectedOrder.tenant?.email})</span>
            </div>
            <div>
              <span className="text-slate-500">Địa chỉ giao: </span>
              {selectedOrder.shippingAddress || "Chưa cung cấp"}
            </div>
            {selectedOrder.note && (
              <div>
                <span className="text-slate-500">Ghi chú: </span>
                {selectedOrder.note}
              </div>
            )}
            <div className="border-t border-slate-200/80 pt-3">
              {selectedOrder.items.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span>{i.name} × {i.qty}</span>
                  <span>{(i.priceVnd * i.qty).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-2 border-t border-slate-200/80 mt-2">
                <span>Tổng</span>
                <span>{selectedOrder.totalVnd.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
            {selectedOrder.assignedUid && (
              <div>
                <span className="text-slate-500">UID chip đã gán: </span>
                <span className="font-mono">{selectedOrder.assignedUid}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Thanh toán: </span>
              {selectedOrder.paymentStatus === "manual_confirmed" ? (
                <span className="text-emerald-600 font-medium">Đã xác nhận (thủ công)</span>
              ) : (
                <span className="text-amber-600 font-medium">Chưa thanh toán</span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedOrder.paymentStatus !== "manual_confirmed" && selectedOrder.status !== "cancelled" && (
              <button onClick={() => confirmPayment(selectedOrder)} className="text-xs font-medium bg-amber-500 text-white px-3 py-2 rounded-full">
                Xác nhận đã thanh toán (demo)
              </button>
            )}
            {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
              <button onClick={() => advanceStatus(selectedOrder)} className="text-xs font-medium bg-blue-600 text-white px-3 py-2 rounded-full">
                Chuyển sang: {STATUS_LABEL[STATUS_FLOW[STATUS_FLOW.indexOf(selectedOrder.status) + 1]]}
              </button>
            )}
            {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
              <button onClick={() => cancelOrder(selectedOrder)} className="text-xs font-medium bg-red-50 text-red-600 px-3 py-2 rounded-full">
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Loại (vd: Mô hình 3D, Biển gỗ...)"
              value={newProduct.type}
              onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Giá (VNĐ)"
              value={newProduct.priceVnd}
              onChange={(e) => setNewProduct({ ...newProduct, priceVnd: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="URL ảnh (tùy chọn)"
              value={newProduct.imageUrl}
              onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Mô tả"
              rows={3}
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button onClick={handleAddProduct} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium">
              Thêm sản phẩm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
