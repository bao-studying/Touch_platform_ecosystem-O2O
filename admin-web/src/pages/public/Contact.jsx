import { useEffect, useState } from "react";
import { Clock, Handshake, Mail, MessageCircle, Phone } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import api from "../../api/axios";
import { CONTACT_INFO } from "../../lib/contactInfo";

const SOCIAL_ICONS = { facebook: SiFacebook, instagram: SiInstagram, tiktok: SiTiktok, youtube: SiYoutube };

// 1 dòng thông tin liên hệ: biểu tượng + nhãn nhỏ + nội dung (có thể là liên kết).
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-500/10 text-clay-500">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-espresso-600">{label}</div>
        <div className="mt-0.5 text-sm text-espresso-900">{children}</div>
      </div>
    </div>
  );
}

const linkClass = "font-medium underline decoration-clay-500/40 underline-offset-4 transition-colors hover:decoration-clay-500";

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

        <div className="mt-8 space-y-6">
          <InfoRow icon={Mail} label="Email hỗ trợ">
            <a href={`mailto:${CONTACT_INFO.supportEmail}`} className={linkClass}>
              {CONTACT_INFO.supportEmail}
            </a>
            <p className="mt-0.5 text-xs text-espresso-600">{CONTACT_INFO.responseTime}</p>
          </InfoRow>

          <InfoRow icon={Handshake} label="Kinh doanh & hợp tác">
            <a href={`mailto:${CONTACT_INFO.salesEmail}`} className={linkClass}>
              {CONTACT_INFO.salesEmail}
            </a>
            <span className="mt-0.5 block">
              <a href={`mailto:${CONTACT_INFO.partnerEmail}`} className={linkClass}>
                {CONTACT_INFO.partnerEmail}
              </a>
              <span className="text-xs text-espresso-600"> — đại lý, đối tác triển khai</span>
            </span>
          </InfoRow>

          <InfoRow icon={Phone} label="Hotline">
            <a href={`tel:${(support.supportHotline || CONTACT_INFO.hotline).replace(/\s/g, "")}`} className={linkClass}>
              {support.supportHotline || CONTACT_INFO.hotline}
            </a>
          </InfoRow>

          <InfoRow icon={MessageCircle} label="Zalo">
            {support.supportZalo || CONTACT_INFO.zalo}
          </InfoRow>

          <InfoRow icon={Clock} label="Giờ làm việc">
            <ul className="space-y-0.5">
              {CONTACT_INFO.workingHours.map((h) => (
                <li key={h.days} className="grid grid-cols-[10.5rem_auto] gap-x-4">
                  <span className="text-espresso-700">{h.days}</span>
                  <span className="font-medium">{h.time}</span>
                </li>
              ))}
            </ul>
          </InfoRow>
        </div>

        <div className="mt-9">
          <div className="text-xs font-medium uppercase tracking-wide text-espresso-600">Theo dõi chúng tôi</div>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {CONTACT_INFO.socials.map((soc) => {
              const Icon = SOCIAL_ICONS[soc.key];
              return (
                <li key={soc.key}>
                  <a
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-cream-200 transition-all hover:-translate-y-0.5 hover:ring-clay-500/40 hover:shadow-[0_14px_28px_-18px_rgba(59,35,24,0.5)]"
                  >
                    <Icon size={18} className="text-espresso-700 transition-colors group-hover:text-clay-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-espresso-950">{soc.label}</span>
                      <span className="block truncate text-xs text-espresso-600">{soc.handle}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
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
