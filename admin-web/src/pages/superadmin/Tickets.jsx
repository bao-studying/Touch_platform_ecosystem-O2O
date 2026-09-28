import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import { useToast } from "../../components/superadmin/Toast";
import Modal from "../../components/superadmin/Modal";

const STATUS_LABEL = { open: "Mới", in_progress: "Đang xử lý", resolved: "Đã xử lý" };
const STATUS_COLOR = {
  open: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
};

export default function Tickets() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    superAdminApi
      .get("/super-admin/tickets")
      .then((res) => setTickets(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLoadError("Không tải được danh sách ticket, vui lòng thử lại."));
  };
  useEffect(() => {
    load();
  }, []);

  const openTicket = (t) => {
    setSelected(t);
    setReply("");
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await superAdminApi.post(`/super-admin/tickets/${selected._id}/reply`, { message: reply });
      setSelected(res.data);
      setTickets((ts) => ts.map((t) => (t._id === res.data._id ? res.data : t)));
      setReply("");
      toast.success("Đã gửi phản hồi", "Khách hàng sẽ nhận được ngay lập tức.");
    } catch (err) {
      toast.error("Gửi phản hồi thất bại", err.response?.data?.message || "Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await superAdminApi.put(`/super-admin/tickets/${selected._id}/status`, { status });
      setSelected(res.data);
      setTickets((ts) => ts.map((t) => (t._id === res.data._id ? res.data : t)));
      toast.success("Đã cập nhật trạng thái ticket");
    } catch (err) {
      toast.error("Không đổi được trạng thái", err.response?.data?.message || "Vui lòng thử lại.");
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-white">Hỗ trợ & Sự cố</h1>

      <div className="mt-5 bg-neutral-900 border border-white/5 rounded-3xl divide-y divide-white/5">
        {loadError && <div className="px-5 py-4 text-sm text-red-400">{loadError}</div>}
        {tickets.map((t) => (
          <button key={t._id} onClick={() => openTicket(t)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-white/5">
            <div>
              <div className="font-medium text-white">{t.subject}</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {t.tenant?.name} · {t.messages?.length || 0} tin nhắn
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR[t.status] || "bg-white/10 text-neutral-400"}`}>
              {STATUS_LABEL[t.status] || t.status}
            </span>
          </button>
        ))}
        {!loadError && tickets.length === 0 && (
          <div className="px-5 py-12 text-center text-neutral-600 text-sm flex flex-col items-center gap-2">
            <MessageSquare size={24} className="text-neutral-700" />
            Chưa có ticket nào
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.subject} onClose={() => setSelected(null)} maxWidth="max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-500">{selected.tenant?.name} · {selected.tenant?.email}</span>
            <select
              value={selected.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs border border-white/10 bg-white/5 text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(selected.messages || []).map((m, idx) => (
              <div key={idx} className={`flex ${m.from === "superadmin" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === "superadmin" ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "bg-white/10 text-white"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-0.5">{m.senderName}</div>
                  {m.message}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              placeholder="Trả lời..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <button
              onClick={handleReply}
              disabled={sending}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            >
              Gửi
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
