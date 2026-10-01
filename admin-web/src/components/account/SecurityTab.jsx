import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import PasswordFieldLight from "./PasswordFieldLight";
import { Notice } from "./ui";

export default function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ kind: "success", text: "" });

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ kind: "success", text: "" });
    if (form.newPassword !== form.confirm) {
      setMsg({ kind: "error", text: "Mật khẩu nhập lại không khớp" });
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setMsg({ kind: "success", text: "Đã đổi mật khẩu thành công." });
    } catch (err) {
      setMsg({ kind: "error", text: err.response?.data?.message || "Không thể đổi mật khẩu, vui lòng thử lại" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4 rounded-3xl bg-white p-5 ring-1 ring-cream-200 sm:p-7">
      <h2 className="font-display text-xl font-semibold text-espresso-950">Đổi mật khẩu</h2>
      <PasswordFieldLight label="Mật khẩu hiện tại" autoComplete="current-password" value={form.currentPassword} onChange={(v) => setForm({ ...form, currentPassword: v })} />
      <PasswordFieldLight label="Mật khẩu mới" hint="Tối thiểu 6 ký tự" autoComplete="new-password" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} />
      <PasswordFieldLight label="Nhập lại mật khẩu mới" autoComplete="new-password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} />
      <Notice kind={msg.kind}>{msg.text}</Notice>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
      >
        {saving && <Loader2 size={15} className="animate-spin" />}
        {saving ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
