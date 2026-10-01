import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import AddressForm from "./AddressForm";
import { Notice } from "./ui";

export default function AddressesTab() {
  const { admin } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | "new" | address._id (đang sửa)
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    api
      .get("/customer/profile")
      .then((res) => setAddresses(res.data.addresses))
      .catch(() => setError("Không tải được danh sách địa chỉ, vui lòng thử lại"))
      .finally(() => setLoading(false));
  }, []);

  const onSaved = (profile) => {
    setAddresses(profile.addresses);
    setMode(null);
  };

  const makeDefault = async (id) => {
    setError("");
    try {
      const res = await api.put(`/customer/addresses/${id}`, { isDefault: true });
      setAddresses(res.data.addresses);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể đặt mặc định");
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      const res = await api.delete(`/customer/addresses/${id}`);
      setAddresses(res.data.addresses);
      setConfirmId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa địa chỉ");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-espresso-950">Địa chỉ giao hàng</h2>
          <p className="text-sm text-espresso-600">Lưu sẵn địa chỉ để đặt hàng nhanh hơn (tối đa 10 địa chỉ).</p>
        </div>
        {mode === null && (
          <button
            onClick={() => setMode("new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-espresso-800"
          >
            <Plus size={15} /> Thêm địa chỉ
          </button>
        )}
      </div>

      <Notice kind="error">{error}</Notice>

      {mode === "new" && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-cream-200 sm:p-7">
          <h3 className="mb-4 font-display text-lg font-semibold text-espresso-950">Địa chỉ mới</h3>
          <AddressForm defaultName={admin?.name} onSaved={onSaved} onCancel={() => setMode(null)} />
        </div>
      )}

      {loading ? (
        <div className="h-28 animate-pulse rounded-3xl bg-cream-100" />
      ) : addresses.length === 0 && mode !== "new" ? (
        <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-cream-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-espresso-600">
            <MapPin size={22} />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-espresso-950">Chưa có địa chỉ nào</p>
          <p className="mt-1 text-sm text-espresso-600">Thêm địa chỉ đầu tiên để sẵn sàng đặt hàng.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) =>
            mode === a._id ? (
              <li key={a._id} className="rounded-3xl bg-white p-5 ring-1 ring-cream-200 md:col-span-2 sm:p-7">
                <h3 className="mb-4 font-display text-lg font-semibold text-espresso-950">Sửa địa chỉ</h3>
                <AddressForm initial={a} onSaved={onSaved} onCancel={() => setMode(null)} />
              </li>
            ) : (
              <li key={a._id} className={`flex flex-col rounded-3xl bg-white p-5 ring-1 ${a.isDefault ? "ring-2 ring-espresso-900" : "ring-cream-200"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {a.label && <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-espresso-800">{a.label}</span>}
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                      <Star size={11} fill="currentColor" /> Mặc định
                    </span>
                  )}
                </div>
                <div className="mt-3 font-medium text-espresso-950">
                  {a.fullName} <span className="font-normal text-espresso-600">· {a.phone}</span>
                </div>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-espresso-700">{[a.line, a.ward, a.district, a.province].filter(Boolean).join(", ")}</p>

                <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-cream-100 pt-3 text-sm">
                  <button onClick={() => setMode(a._id)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-espresso-800 transition-colors hover:bg-cream-100">
                    <Pencil size={13} /> Sửa
                  </button>
                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a._id)} className="rounded-full px-3 py-1.5 text-espresso-800 transition-colors hover:bg-cream-100">
                      Đặt mặc định
                    </button>
                  )}
                  {confirmId === a._id ? (
                    <span className="ml-auto flex items-center gap-1">
                      <button onClick={() => remove(a._id)} className="rounded-full bg-clay-500 px-3 py-1.5 font-medium text-white hover:brightness-110">
                        Xóa
                      </button>
                      <button onClick={() => setConfirmId(null)} className="rounded-full px-3 py-1.5 text-espresso-700 hover:bg-cream-100">
                        Hủy
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(a._id)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-espresso-600 transition-colors hover:bg-clay-500/10 hover:text-clay-500">
                      <Trash2 size={13} /> Xóa
                    </button>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
