import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Store,
  CreditCard,
  History,
  MapPin,
  HelpCircle,
  Info,
  LogOut,
  Copy,
  Check,
  Plus,
  X,
  RefreshCw,
  Phone,
  ChevronRight,
  ArrowLeft,
  Bug,
  Send,
} from "lucide-react";
import api from "../../api/axios";
import adminServerApi from "../../lib/adminServerAxios";
import { adminServerSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { getPlanLimits, PLAN_LABELS } from "../../utils/planLimits";
import EditPopup from "../../components/admin/setup/EditPopup";
import useDismissablePopup from "../../hooks/useDismissablePopup";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";

const APP_VERSION = "1.1.0";

const TICKET_STATUS_LABEL = { open: "Đang chờ", in_progress: "Đang xử lý", resolved: "Đã xử lý" };
const TICKET_STATUS_STYLE = {
  open: "bg-clay-500/10 text-clay-500",
  in_progress: "bg-amber-400/15 text-amber-600",
  resolved: "bg-sage-400/15 text-sage-500",
};

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-espresso-900/5 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-espresso-800" />
        <h2 className="text-sm font-semibold text-espresso-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Hàng bấm mở popup — dùng cho Lịch sử nâng cấp & Trung tâm Trợ giúp (dữ liệu gọn, không cần chiếm chỗ sẵn trên trang)
function PopupRow({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl bg-white ring-1 ring-espresso-900/5 shadow-sm p-4 text-left">
      <Icon size={16} className="text-espresso-800 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-espresso-900">{title}</p>
        {subtitle && <p className="text-xs text-espresso-700/50 mt-0.5">{subtitle}</p>}
      </div>
      <ChevronRight size={16} className="text-espresso-700/30 shrink-0" />
    </button>
  );
}

// overlay=true: mở từ avatar mobile trên Home — trượt vào từ phải, đè lên trang chủ đang mờ dần
// phía sau (xem pattern "modal route" ở App.jsx), thay vì chuyển hẳn sang trang mới.
// overlay=false (mặc định): trang bình thường, dùng khi vào thẳng URL hoặc từ sidebar desktop.
export default function AccountSettings({ overlay = false }) {
  const { admin, logout } = useAuth();
  const { business, updateBusinessLocal } = useBusiness();
  const { showToast } = useToast();
  const navigate = useNavigate();
  // duration khớp với thời lượng animate-slide-out-right (220ms) để requestClose() không unmount
  // sớm hơn lúc hiệu ứng trượt ra thật sự chạy xong.
  const { closing, requestClose, backdropProps } = useDismissablePopup(() => navigate(-1), { disabled: !overlay, duration: 220 });
  // Khoá cuộn trang chủ phía sau trong lúc drawer overlay đang mở trên mobile.
  useLockBodyScroll(overlay);

  const [name, setName] = useState(admin?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [newBranch, setNewBranch] = useState("");
  const [updateMsg, setUpdateMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // "Báo cáo sự cố" — tenant gửi report lỗi app tới Super Admin (khác hoàn toàn với "Góp ý" của
  // khách hàng cuối). Dữ liệu này nằm ở ADMIN SERVER (repo/server riêng), gọi qua adminServerApi.
  const [tickets, setTickets] = useState([]);
  const [ticketsError, setTicketsError] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // null = đang ở màn danh sách
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const loadTickets = () => {
    setTicketsError(false);
    adminServerApi
      .get("/tickets/mine")
      .then((res) => setTickets(res.data))
      .catch(() => setTicketsError(true));
  };

  useEffect(() => {
    loadTickets();
    // Super Admin trả lời ngay trong lúc tenant đang dùng app → báo ngay bằng toast + tự cập nhật
    // danh sách, không cần tải lại trang.
    const onReply = () => {
      loadTickets();
      showToast("Có phản hồi mới cho báo cáo sự cố của bạn", "info");
    };
    adminServerSocket.on("ticket:reply", onReply);
    return () => adminServerSocket.off("ticket:reply", onReply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!business) return;
    api.get(`/business/${business._id}/history`).then((res) => setHistory(res.data)).catch(() => {});
  }, [business]);

  if (!business) return null;
  const limits = getPlanLimits(business.plan);
  const publicUrl = `${window.location.origin}/p/${business.slug}`;

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await api.put("/auth/me", { name });
      showToast("Đã cập nhật tên hiển thị", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Không lưu được, thử lại nhé.", "error");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg("");
    try {
      await api.put("/auth/me/password", pw);
      setPw({ currentPassword: "", newPassword: "" });
      setPwMsg("✓ Đã đổi mật khẩu thành công");
    } catch (err) {
      setPwMsg(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAddBranch = async () => {
    if (!newBranch.trim()) return;
    try {
      const res = await api.put(`/business/${business._id}`, { branches: [...business.branches, newBranch.trim()] });
      updateBusinessLocal(res.data);
      setNewBranch("");
      showToast("Đã thêm chi nhánh", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Không thêm được, thử lại nhé.", "error");
    }
  };

  const handleRemoveBranch = async (branch) => {
    try {
      const res = await api.put(`/business/${business._id}`, { branches: business.branches.filter((b) => b !== branch) });
      updateBusinessLocal(res.data);
      showToast("Đã xóa chi nhánh", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Không xóa được, thử lại nhé.", "error");
    }
  };

  const handleCheckUpdate = async () => {
    setUpdateMsg("Đang kiểm tra...");
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          setUpdateMsg("Đã kiểm tra — bạn đang dùng bản mới nhất.");
        } else {
          setUpdateMsg("Chưa cài đặt như PWA nên không có bản cập nhật nền để kiểm tra.");
        }
      } else {
        setUpdateMsg("Trình duyệt này không hỗ trợ kiểm tra cập nhật nền.");
      }
    } catch {
      setUpdateMsg("Không kiểm tra được lúc này, thử lại sau.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setSubmittingTicket(true);
    try {
      const res = await adminServerApi.post("/tickets", { subject: newSubject.trim(), message: newMessage.trim() });
      setTickets((prev) => [res.data, ...prev]);
      setNewSubject("");
      setNewMessage("");
      showToast("Đã gửi báo cáo sự cố", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Không gửi được, thử lại nhé.", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSubmittingTicket(true);
    try {
      const res = await adminServerApi.post(`/tickets/${selectedTicket._id}/reply`, { message: replyText.trim() });
      setSelectedTicket(res.data);
      setTickets((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
      setReplyText("");
    } catch (err) {
      showToast(err.response?.data?.message || "Không gửi được, thử lại nhé.", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const content = (
    <div className="max-w-2xl mx-auto px-4 py-5 md:px-8 md:py-8 space-y-4">
      {!overlay && <h1 className="font-display text-2xl text-espresso-950">Cài đặt tài khoản</h1>}

      <Section icon={User} title="Thông tin cá nhân">
        <div className="space-y-2">
          <label className="text-xs text-espresso-700/60">Họ tên</label>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-xl border border-espresso-900/15 px-3 py-2 text-sm" />
            <button onClick={handleSaveName} disabled={savingName} className="rounded-xl bg-espresso-800 text-cream-50 px-3 text-sm disabled:opacity-60">
              Lưu
            </button>
          </div>
          <p className="text-xs text-espresso-700/50">{admin?.email}</p>
        </div>
      </Section>

      <Section icon={Lock} title="Đổi mật khẩu">
        <form onSubmit={handleChangePassword} className="space-y-2">
          <input
            type="password"
            required
            placeholder="Mật khẩu hiện tại"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            className="w-full rounded-xl border border-espresso-900/15 px-3 py-2 text-sm"
          />
          {pwMsg && <p className="text-xs text-espresso-700/70">{pwMsg}</p>}
          <button type="submit" disabled={pwSaving} className="w-full rounded-xl bg-espresso-800 text-cream-50 py-2 text-sm font-medium disabled:opacity-60">
            {pwSaving ? "Đang lưu..." : "Đổi mật khẩu"}
          </button>
        </form>
      </Section>

      <Section icon={Store} title="Thông tin doanh nghiệp">
        <p className="text-sm text-espresso-900 font-medium mb-1">{business.name}</p>
        <div className="flex items-center gap-2 bg-espresso-900/5 rounded-lg px-3 py-2">
          <p className="text-xs text-espresso-700/70 truncate flex-1">{publicUrl}</p>
          <button onClick={handleCopyLink} className="shrink-0 text-espresso-800">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </Section>

      <Section icon={CreditCard} title="Gói dịch vụ hiện tại">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-espresso-900">{PLAN_LABELS[business.plan]}</p>
            <p className="text-xs text-espresso-700/60">
              {business.planExpiresAt ? `Hết hạn: ${new Date(business.planExpiresAt).toLocaleDateString("vi-VN")}` : "Không giới hạn thời gian"}
            </p>
          </div>
          <button onClick={() => navigate("/admin/store")} className="text-sm text-espresso-800 font-medium underline">
            Quản lý gói
          </button>
        </div>
      </Section>

      <PopupRow icon={History} title="Lịch sử nâng cấp" subtitle={`${history.length} lần thay đổi`} onClick={() => setShowHistory(true)} />

      {limits.hasMultiBranch && (
        <Section icon={MapPin} title="Quản lý chi nhánh">
          <div className="space-y-2 mb-2">
            {business.branches.map((b) => (
              <div key={b} className="flex items-center justify-between bg-espresso-900/5 rounded-lg px-3 py-1.5">
                <span className="text-sm text-espresso-900">{b}</span>
                <button onClick={() => handleRemoveBranch(b)} className="text-clay-500">
                  <X size={14} />
                </button>
              </div>
            ))}
            {business.branches.length === 0 && <p className="text-xs text-espresso-700/50">Chưa có chi nhánh nào.</p>}
          </div>
          <div className="flex gap-2">
            <input
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="Tên chi nhánh mới"
              className="flex-1 rounded-lg border border-espresso-900/15 px-3 py-1.5 text-sm"
            />
            <button onClick={handleAddBranch} className="rounded-lg bg-espresso-800 text-cream-50 px-3">
              <Plus size={15} />
            </button>
          </div>
        </Section>
      )}

      <PopupRow icon={HelpCircle} title="Trung tâm Trợ giúp" subtitle="Hướng dẫn NFC/QR, mẹo decor, liên hệ hỗ trợ" onClick={() => setShowHelp(true)} />

      <PopupRow
        icon={Bug}
        title="Báo cáo sự cố"
        subtitle={
          ticketsError
            ? "Không tải được — bấm để thử lại"
            : tickets.length === 0
            ? "Gặp lỗi khi dùng app? Báo ngay cho đội ngũ vận hành"
            : `${tickets.length} báo cáo đã gửi`
        }
        onClick={() => {
          setSelectedTicket(null);
          setShowReport(true);
          if (ticketsError) loadTickets();
        }}
      />

      <Section icon={Info} title="Phiên bản ứng dụng">
        <div className="flex items-center justify-between">
          <p className="text-sm text-espresso-700/70">O2O Brand v{APP_VERSION}</p>
          <button onClick={handleCheckUpdate} className="flex items-center gap-1.5 text-sm text-espresso-800 font-medium">
            <RefreshCw size={14} /> Kiểm tra cập nhật
          </button>
        </div>
        {updateMsg && <p className="text-xs text-espresso-700/50 mt-2">{updateMsg}</p>}
      </Section>

      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-xl bg-clay-500/10 text-clay-500 py-3 text-sm font-medium">
        <LogOut size={16} /> Đăng xuất
      </button>

      {showHistory && (
        <EditPopup title="Lịch sử nâng cấp" onClose={() => setShowHistory(false)}>
          {history.length === 0 ? (
            <p className="text-sm text-espresso-700/50 text-center py-4">Chưa có lịch sử thay đổi gói.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm rounded-xl bg-espresso-900/5 px-3 py-2.5">
                  <span className="text-espresso-900 font-medium">{PLAN_LABELS[h.plan]}</span>
                  <span className="text-espresso-700/50 text-xs">{new Date(h.changedAt).toLocaleString("vi-VN")}</span>
                </div>
              ))}
            </div>
          )}
        </EditPopup>
      )}

      {showHelp && (
        <EditPopup title="Trung tâm Trợ giúp" onClose={() => setShowHelp(false)}>
          <ul className="text-sm text-espresso-700/70 space-y-2.5 list-disc pl-4 mb-4">
            <li>Chạm mặt sau điện thoại (có NFC) vào vị trí chip trên mô hình decor, giữ 1-2 giây.</li>
            <li>Không có NFC? Dùng camera quét mã QR dán kèm trên mô hình.</li>
            <li>Đặt mô hình decor ở nơi khách dễ thấy, dễ với tay tới — quầy thu ngân hoặc đầu bàn là vị trí tốt.</li>
          </ul>
          {business.hotline && (
            <a href={`tel:${business.hotline}`} className="flex items-center gap-2 text-sm text-espresso-800 font-medium">
              <Phone size={14} /> Hotline hỗ trợ: {business.hotline}
            </a>
          )}
        </EditPopup>
      )}

      {showReport && !selectedTicket && (
        <EditPopup title="Báo cáo sự cố" onClose={() => setShowReport(false)}>
          <form onSubmit={handleCreateTicket} className="space-y-2 mb-5">
            <p className="text-xs text-espresso-700/50 mb-1">
              Gặp lỗi hoặc trục trặc khi dùng app (khác với "Góp ý" của khách hàng) — gửi thẳng cho đội ngũ vận hành.
            </p>
            <input
              required
              maxLength={150}
              placeholder="Tiêu đề ngắn gọn (VD: Không tạo được mã QR)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full rounded-xl border border-espresso-900/15 px-3 py-2 text-sm"
            />
            <textarea
              required
              rows={3}
              maxLength={2000}
              placeholder="Mô tả chi tiết sự cố bạn gặp phải..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full rounded-xl border border-espresso-900/15 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submittingTicket}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-espresso-800 text-cream-50 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              <Send size={15} /> {submittingTicket ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </form>

          <p className="text-xs font-medium text-espresso-700/60 mb-2">Báo cáo đã gửi</p>
          {ticketsError ? (
            <button onClick={loadTickets} className="flex items-center gap-1.5 text-xs text-clay-500">
              <RefreshCw size={13} /> Không tải được, bấm để thử lại
            </button>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-espresso-700/50 text-center py-4">Chưa có báo cáo nào.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className="w-full flex items-center justify-between gap-2 text-left rounded-xl bg-espresso-900/5 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-espresso-900 font-medium truncate">{t.subject}</p>
                    <p className="text-[11px] text-espresso-700/50">{new Date(t.updatedAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${TICKET_STATUS_STYLE[t.status]}`}>
                    {TICKET_STATUS_LABEL[t.status]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </EditPopup>
      )}

      {showReport && selectedTicket && (
        <EditPopup
          title={selectedTicket.subject}
          onClose={() => {
            setShowReport(false);
            setSelectedTicket(null);
          }}
        >
          <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-1.5 text-xs text-espresso-700/60 mb-3">
            <ArrowLeft size={13} /> Danh sách báo cáo
          </button>

          <span className={`inline-block text-[10px] px-2 py-1 rounded-full font-medium mb-3 ${TICKET_STATUS_STYLE[selectedTicket.status]}`}>
            {TICKET_STATUS_LABEL[selectedTicket.status]}
          </span>

          <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto pr-1">
            {selectedTicket.messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                  m.from === "tenant" ? "bg-espresso-800 text-cream-50 ml-auto" : "bg-espresso-900/5 text-espresso-900"
                }`}
              >
                <p>{m.message}</p>
                <p className={`text-[10px] mt-1 ${m.from === "tenant" ? "text-cream-100/60" : "text-espresso-700/40"}`}>
                  {m.from === "tenant" ? "Bạn" : "Đội ngũ hỗ trợ"} · {new Date(m.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
          </div>

          {selectedTicket.status !== "resolved" ? (
            <form onSubmit={handleReplyTicket} className="flex gap-2">
              <input
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhắn thêm..."
                className="flex-1 rounded-xl border border-espresso-900/15 px-3 py-2 text-sm"
              />
              <button type="submit" disabled={submittingTicket} className="rounded-xl bg-espresso-800 text-cream-50 px-3 disabled:opacity-60" aria-label="Gửi">
                <Send size={15} />
              </button>
            </form>
          ) : (
            <p className="text-xs text-espresso-700/50 text-center">Báo cáo này đã được xử lý xong.</p>
          )}
        </EditPopup>
      )}
    </div>
  );

  if (!overlay) return content;

  // Chế độ overlay (mobile): trượt vào từ phải kiểu menu 3 gạch trên app FB — panel chiếm gần
  // hết chiều rộng (85%), chỉ chừa 1 khoảng hở nhỏ bên trái lộ trang chủ mờ phía sau qua lớp
  // backdrop tối + blur, vừa đủ để nội dung cài đặt (input, nút...) không bị chật. Bấm vào phần
  // lộ ra đó hoặc nút mũi tên quay lại đều đóng có hiệu ứng trượt ra trước khi thật sự back về
  // Home (xem useDismissablePopup + pattern backgroundLocation ở App.jsx). Từ sm trở lên dùng bề
  // rộng cố định vì màn hình đã đủ lớn để không cần kiểu "hé lộ".
  return (
    <div
      {...backdropProps}
      className={`fixed inset-0 z-40 bg-espresso-950/40 backdrop-blur-sm flex justify-end ${closing ? "animate-fade-out" : "animate-fade-in"}`}
    >
      <div
        className={`w-[85%] sm:w-[440px] h-full bg-cream-100 overflow-y-auto shadow-2xl ${
          closing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >
        <div className="sticky top-0 z-10 bg-cream-100/95 backdrop-blur px-3 py-3 flex items-center gap-2 border-b border-espresso-900/8">
          <button onClick={requestClose} className="p-2 -ml-1 text-espresso-800 rounded-full active:bg-espresso-900/5" aria-label="Quay lại">
            <ArrowLeft size={20} />
          </button>
          <span className="font-display text-lg text-espresso-950">Cài đặt tài khoản</span>
        </div>
        {content}
      </div>
    </div>
  );
}
