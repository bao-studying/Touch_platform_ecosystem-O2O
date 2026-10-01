import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import { Field, Notice, inputClass } from "./ui";

const EMPTY = { label: "", fullName: "", phone: "", province: "", district: "", ward: "", line: "", isDefault: false };

// Form thêm/sửa địa chỉ giao hàng — dùng ở tab "Địa chỉ" (Tài khoản) và ngay trong bước đặt hàng (Giỏ hàng).
// `initial` có _id → sửa (PUT); không có → thêm mới (POST). onSaved nhận về hồ sơ đầy đủ đã cập nhật từ server.
export default function AddressForm({ initial, defaultName = "", onSaved, onCancel, submitLabel = "Lưu địa chỉ" }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState({ ...EMPTY, fullName: defaultName, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // form này có thể nằm trong khu vực có form khác (đặt hàng) — không để sự kiện nổi lên
    setError("");
    setSaving(true);
    try {
      const res = editing
        ? await api.put(`/customer/addresses/${initial._id}`, form)
        : await api.post("/customer/addresses", form);
      onSaved?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu địa chỉ, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ tên người nhận *">
          <input required value={form.fullName} onChange={set("fullName")} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Số điện thoại *">
          <input required inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="0901 234 567" className={inputClass} />
        </Field>
      </div>

      <Field label="Tỉnh / Thành phố *">
        <input required value={form.province} onChange={set("province")} autoComplete="address-level1" placeholder="VD: TP. Hồ Chí Minh" className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quận / Huyện">
          <input value={form.district} onChange={set("district")} autoComplete="address-level2" className={inputClass} />
        </Field>
        <Field label="Phường / Xã">
          <input value={form.ward} onChange={set("ward")} className={inputClass} />
        </Field>
      </div>
      <Field label="Địa chỉ chi tiết *" hint="Số nhà, tên đường, tòa nhà…">
        <input required value={form.line} onChange={set("line")} autoComplete="address-line1" className={inputClass} />
      </Field>

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <Field label="Nhãn địa chỉ" hint="Không bắt buộc — VD: Nhà riêng, Quán, Văn phòng">
          <input value={form.label} onChange={set("label")} maxLength={30} className={inputClass} />
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 pb-2 text-sm text-espresso-800">
          <input
            type="checkbox"
            checked={Boolean(form.isDefault)}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            className="h-4 w-4 rounded border-cream-200 accent-espresso-900"
          />
          Đặt làm địa chỉ mặc định
        </label>
      </div>

      <Notice kind="error">{error}</Notice>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Đang lưu..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full px-5 py-2.5 text-sm font-medium text-espresso-700 transition-colors hover:bg-cream-100">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
