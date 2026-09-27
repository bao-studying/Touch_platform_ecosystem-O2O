import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import Modal from "../../components/superadmin/Modal";

const STATUS_LABEL = { open: "Mới", in_progress: "Đang xử lý", resolved: "Đã xử lý" };
const STATUS_COLOR = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-600/10 text-indigo-600",
  resolved: "bg-emerald-50 text-emerald-600",
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = () =>
    superAdminApi
      .get("/super-admin/tickets")
      .then((res) => {
        setTickets(Array.isArray(res.data) ? res.data : []);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  useEffect(load, []);

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
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    const res = await superAdminApi.put(`/super-admin/tickets/${selected._id}/status`, { status });
    setSelected(res.data);
    setTickets((ts) => ts.map((t) => (t._id === res.data._id ? res.data : t)));
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Hỗ trợ & Sự cố</h1>

      <div className="mt-5 bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-200/80">
        {tickets.map((t) => (
          <button key={t._id} onClick={() => openTicket(t)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-slate-50/50">
            <div>
              <div className="font-medium text-slate-900">{t.subject}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t.tenant?.name} · {(t.messages?.length ?? 0)} tin nhắn
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR[t.status] || "bg-slate-100 text-slate-600"}`}>
              {STATUS_LABEL[t.status] || t.status}
            </span>
          </button>
        ))}
        {loadError && (
          <div className="px-5 py-12 text-center text-red-500 text-sm">
            Không tải được danh sách ticket. Kiểm tra Admin Server có đang chạy không rồi thử lại.
          </div>
        )}
        {!loadError && tickets.length === 0 && (
          <div className="px-5 py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <MessageSquare size={24} className="text-slate-300" />
            Chưa có ticket nào
          </div>
        )}
      </div>

      {selected && (
        <Modal title={selected.subject} onClose={() => setSelected(null)} maxWidth="max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">{selected.tenant?.name} · {selected.tenant?.email}</span>
            <select
              value={selected.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1"
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
                    m.from === "superadmin" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-800"
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
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <button
              onClick={handleReply}
              disabled={sending}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            >
              Gửi
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
