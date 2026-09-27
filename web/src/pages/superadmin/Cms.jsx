import { useEffect, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Save, Check } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";

const SECTIONS = [
  { key: "hero", label: "Trang chủ — Hero", hasCta: true },
  { key: "usecases", label: "Trang chủ — Use Cases", hasCta: false },
  { key: "about", label: "Trang Giới thiệu (About Us)", hasCta: false },
  { key: "contact_intro", label: "Trang Liên hệ — Giới thiệu", hasCta: false },
];

const QUILL_MODULES = {
  toolbar: [["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], ["link"], ["clean"]],
};

export default function Cms() {
  const [content, setContent] = useState({});
  const [active, setActive] = useState(SECTIONS[0].key);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    superAdminApi.get("/super-admin/cms").then((res) => {
      const bySection = Object.fromEntries(res.data.map((s) => [s.section, s]));
      setContent(bySection);
    });
  }, []);

  const activeData = content[active] || { title: "", bodyHtml: "", ctaLabel: "", ctaLink: "" };
  const setField = (field, value) => setContent((c) => ({ ...c, [active]: { ...activeData, [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await superAdminApi.put(`/super-admin/cms/${active}`, activeData);
      setContent((c) => ({ ...c, [active]: res.data }));
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const sectionMeta = SECTIONS.find((s) => s.key === active);

  return (
    <div className="p-5 md:p-8 max-w-4xl pb-28">
      <h1 className="text-2xl font-semibold text-white tracking-tight">Nội dung trang chủ (CMS)</h1>
      <p className="text-sm text-neutral-500 mt-1">Chỉnh nội dung hiển thị trên SaaS Landing Page công khai — thay đổi có hiệu lực ngay khi lưu.</p>

      <div className="mt-5 flex gap-2 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              active === s.key
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-sm shadow-orange-500/30"
                : "bg-neutral-900 text-neutral-400 border border-white/10 hover:border-white/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-5 bg-neutral-900 border border-white/5 rounded-3xl p-5">
        <label className="text-xs font-medium text-neutral-500">Tiêu đề</label>
        <input
          value={activeData.title || ""}
          onChange={(e) => setField("title", e.target.value)}
          className="w-full mt-1.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        />

        <label className="text-xs font-medium text-neutral-500 mt-4 block">Nội dung</label>
        <div className="mt-1.5 dash-quill">
          <ReactQuill
            theme="snow"
            value={activeData.bodyHtml || ""}
            onChange={(html) => setField("bodyHtml", html)}
            modules={QUILL_MODULES}
            className="[&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:min-h-[160px]"
          />
        </div>

        {sectionMeta?.hasCta && (
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs font-medium text-neutral-500">Nhãn nút CTA</label>
              <input
                value={activeData.ctaLabel || ""}
                onChange={(e) => setField("ctaLabel", e.target.value)}
                className="w-full mt-1.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500">Liên kết CTA</label>
              <input
                value={activeData.ctaLink || ""}
                onChange={(e) => setField("ctaLink", e.target.value)}
                className="w-full mt-1.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky floating save bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-[calc(50%+8rem)] z-30">
        <div className="flex items-center gap-3 bg-white text-neutral-900 rounded-full pl-5 pr-2 py-2 shadow-2xl shadow-black/50">
          <span className="text-xs text-neutral-500">
            {savedAt ? `Đã lưu lúc ${savedAt.toLocaleTimeString("vi-VN")}` : "Có thay đổi chưa lưu"}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 rounded-full text-sm font-medium disabled:opacity-60"
          >
            {saving ? <Save size={14} className="animate-pulse" /> : savedAt ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
