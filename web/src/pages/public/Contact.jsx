import { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import api from "../../api/axios";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [support, setSupport] = useState({ supportZalo: "", supportHotline: "" });

  useEffect(() => {
    api.get("/public/support-info").then((res) => setSupport(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      await api.post("/contact", form);
      setStatus("done");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "Không thể gửi, vui lòng thử lại");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-16 md:py-20 grid md:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-espresso-950">Liên hệ với chúng tôi</h1>
        <p className="mt-4 text-espresso-700 leading-relaxed max-w-sm">
          Có câu hỏi về sản phẩm, giá, hoặc muốn được tư vấn triển khai? Gửi thông tin bên cạnh, đội ngũ O2O sẽ phản hồi sớm nhất.
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 text-espresso-700">
            <Mail size={18} className="text-clay-500" />
            <span className="text-sm">Phản hồi trong vòng 24 giờ làm việc</span>
          </div>
          {support.supportHotline && (
            <div className="flex items-center gap-3 text-espresso-700">
              <Phone size={18} className="text-clay-500" />
              <span className="text-sm">{support.supportHotline}</span>
            </div>
          )}
          {support.supportZalo && (
            <div className="flex items-center gap-3 text-espresso-700">
              <MessageCircle size={18} className="text-clay-500" />
              <span className="text-sm">Zalo: {support.supportZalo}</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-cream-200 rounded-2xl p-6 space-y-4">
        {status === "done" ? (
          <div className="text-center py-10">
            <div className="font-display text-lg font-semibold text-espresso-950">Cảm ơn bạn đã liên hệ!</div>
            <p className="text-sm text-espresso-600 mt-2">Chúng tôi sẽ phản hồi sớm nhất.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-espresso-800">Họ tên</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-cream-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-espresso-800">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-cream-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-espresso-800">Số điện thoại</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-cream-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-espresso-800">Nội dung</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-cream-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/30"
              />
            </div>
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-espresso-900 text-cream-50 py-3 rounded-full font-medium hover:bg-espresso-800 transition-colors disabled:opacity-60"
            >
              {status === "sending" ? "Đang gửi..." : "Gửi liên hệ"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
