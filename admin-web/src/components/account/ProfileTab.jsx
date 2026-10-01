import { useEffect, useState } from "react";
import { BadgeCheck, Download, Loader2, MailWarning } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { CLIENT_WEB_URL } from "../../lib/config";
import { Field, Notice, inputClass } from "./ui";

export default function ProfileTab() {
  const { admin, updateAdmin } = useAuth();
  const [form, setForm] = useState({ name: admin?.name || "", phone: "" });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ kind: "success", text: "" });
  const [resending, setResending] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState({ kind: "success", text: "" });

  useEffect(() => {
    api
      .get("/customer/profile")
      .then((res) => setForm({ name: res.data.name, phone: res.data.phone }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg({ kind: "success", text: "" });
    setSaving(true);
    try {
      const res = await api.put("/customer/profile", form);
      updateAdmin({ name: res.data.name });
      setMsg({ kind: "success", text: "Đã lưu thông tin tài khoản." });
    } catch (err) {
      setMsg({ kind: "error", text: err.response?.data?.message || "Không thể lưu, vui lòng thử lại" });
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setVerifyMsg({ kind: "success", text: "" });
    try {
      const res = await api.post("/auth/resend-verification");
      setVerifyMsg({ kind: "success", text: res.data.message || "Đã gửi lại email xác thực." });
    } catch (err) {
      setVerifyMsg({ kind: "error", text: err.response?.data?.message || "Không thể gửi email, vui lòng thử lại" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <form onSubmit={save} className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-cream-200 sm:p-7">
        <h2 className="font-display text-xl font-semibold text-espresso-950">Thông tin cá nhân</h2>
        <Field label="Họ tên">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!loaded} className={inputClass} />
        </Field>
        <Field label="Email đăng nhập" hint="Email dùng để đăng nhập nên không thể đổi ở đây.">
          <input value={admin?.email || ""} disabled className={inputClass} />
        </Field>
        <Field label="Số điện thoại" hint="Dùng để O2O liên hệ xác nhận đơn hàng.">
          <input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" disabled={!loaded} className={inputClass} />
        </Field>
        <Notice kind={msg.kind}>{msg.text}</Notice>
        <button
          type="submit"
          disabled={saving || !loaded}
          className="inline-flex items-center gap-2 rounded-full bg-espresso-900 px-6 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-espresso-800 disabled:opacity-60"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>

      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-cream-200 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-espresso-950">Xác thực email</h2>
          {admin?.isEmailVerified ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-espresso-700">
              <BadgeCheck size={18} className="text-sage-500" /> Email của bạn đã được xác thực.
            </p>
          ) : (
            <>
              <p className="mt-3 flex items-start gap-2 text-sm text-espresso-700">
                <MailWarning size={18} className="mt-0.5 shrink-0 text-amber-600" /> Email chưa được xác thực. Hãy bấm vào liên kết trong thư O2O đã gửi để mở khóa đầy đủ tài khoản.
              </p>
              <button
                onClick={resend}
                disabled={resending}
                className="mt-4 rounded-full bg-cream-100 px-5 py-2 text-sm font-medium text-espresso-900 transition-colors hover:bg-cream-200 disabled:opacity-60"
              >
                {resending ? "Đang gửi..." : "Gửi lại email xác thực"}
              </button>
              <div className="mt-3">
                <Notice kind={verifyMsg.kind}>{verifyMsg.text}</Notice>
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl bg-stage-dark p-5 text-cream-50 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Ứng dụng O2O Brand</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream-100/75">Thiết lập trang thương hiệu, quản lý NFC/QR và khách hàng thân thiết ngay trên ứng dụng.</p>
          <a
            href={CLIENT_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-cream-50 px-5 py-2.5 text-sm font-medium text-espresso-950 transition-colors hover:bg-cream-100"
          >
            <Download size={15} /> Tải app
          </a>
        </div>
      </div>
    </div>
  );
}
