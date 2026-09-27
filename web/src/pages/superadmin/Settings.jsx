import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Save, KeyRound } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";

export default function Settings() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ mailFromName: "", notificationEmail: "", supportZalo: "", supportHotline: "" });
  const [cred, setCred] = useState({ name: "", email: "", currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [credMsg, setCredMsg] = useState("");

  useEffect(() => {
    superAdminApi.get("/super-admin/settings").then((res) => {
      setData(res.data);
      setForm(res.data.settings);
      setCred((c) => ({ ...c, name: res.data.superAdminAccount.name, email: res.data.superAdminAccount.email }));
    });
  }, []);

  const handleSaveSettings = async () => {
    const res = await superAdminApi.put("/super-admin/settings", form);
    setForm(res.data);
    setMsg("Đã lưu cài đặt");
    setTimeout(() => setMsg(""), 2500);
  };

  const handleSaveCredentials = async () => {
    setCredMsg("");
    try {
      const payload = { name: cred.name, email: cred.email };
      if (cred.newPassword) {
        payload.currentPassword = cred.currentPassword;
        payload.newPassword = cred.newPassword;
      }
      await superAdminApi.put("/super-admin/settings/credentials", payload);
      setCredMsg("Đã cập nhật thông tin đăng nhập");
      setCred((c) => ({ ...c, currentPassword: "", newPassword: "" }));
    } catch (err) {
      setCredMsg(err.response?.data?.message || "Không thể cập nhật");
    }
  };

  if (!data) return <div className="p-8 text-neutral-500">Đang tải...</div>;

  const EnvRow = ({ label, ok }) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-400" />}
      <span className={ok ? "text-neutral-300" : "text-neutral-500"}>{label}</span>
      <span className="text-xs text-neutral-600 ml-auto">{ok ? "Đã cấu hình" : "Chưa cấu hình (.env)"}</span>
    </div>
  );

  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Cài đặt hệ thống</h1>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
        <h2 className="font-medium text-white mb-1">Trạng thái tích hợp</h2>
        <p className="text-xs text-neutral-500 mb-3">Khóa bí mật (SMTP, SePay...) chỉ được cấu hình qua file .env trên server, không lưu trong database.</p>
        <div className="space-y-2">
          <EnvRow label="Mail API (Nodemailer)" ok={data.envStatus.mailConfigured} />
          <EnvRow label="Cổng thanh toán SePay" ok={data.envStatus.sepayConfigured} />
          <EnvRow label="Kết nối MongoDB" ok={data.envStatus.mongoConfigured} />
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
        <h2 className="font-medium text-white mb-3">Thông tin chung</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-500">Tên người gửi email</label>
            <input
              value={form.mailFromName}
              onChange={(e) => setForm({ ...form, mailFromName: e.target.value })}
              className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Email nhận thông báo</label>
            <input
              value={form.notificationEmail}
              onChange={(e) => setForm({ ...form, notificationEmail: e.target.value })}
              className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Zalo hỗ trợ</label>
            <input
              value={form.supportZalo}
              onChange={(e) => setForm({ ...form, supportZalo: e.target.value })}
              className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500">Hotline hỗ trợ</label>
            <input
              value={form.supportHotline}
              onChange={(e) => setForm({ ...form, supportHotline: e.target.value })}
              className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Save size={16} /> Lưu
          </button>
          {msg && <span className="text-xs text-emerald-400">{msg}</span>}
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
        <h2 className="font-medium text-white mb-1 flex items-center gap-2">
          <KeyRound size={16} className="text-orange-400" /> Tài khoản đăng nhập Super Admin
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Đây là tài khoản dùng để đăng nhập vào khu vực Super Admin (qua trang /login hoặc /super-admin/login) — đổi tại đây có hiệu lực ngay từ lần đăng nhập kế tiếp.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            placeholder="Tên hiển thị"
            value={cred.name}
            onChange={(e) => setCred({ ...cred, name: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <input
            placeholder="Email"
            value={cred.email}
            onChange={(e) => setCred({ ...cred, email: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <input
            type="password"
            placeholder="Mật khẩu hiện tại (chỉ cần nếu đổi mật khẩu)"
            value={cred.currentPassword}
            onChange={(e) => setCred({ ...cred, currentPassword: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <input
            type="password"
            placeholder="Mật khẩu mới (bỏ trống nếu không đổi)"
            value={cred.newPassword}
            onChange={(e) => setCred({ ...cred, newPassword: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleSaveCredentials} className="bg-white text-neutral-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors">
            Cập nhật
          </button>
          {credMsg && <span className="text-xs text-neutral-400">{credMsg}</span>}
        </div>
      </div>
    </div>
  );
}
