import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DollarSign, Users, TrendingDown, TrendingUp, Nfc, Info } from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import { fmtVnd, timeAgo, ACTIVITY_META } from "../../lib/superadminFormat";

const PLAN_COLORS = { free: "#CBD5E1", level1: "#3B82F6", level2: "#6366F1", level3: "#8B5CF6" };

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" } }),
};

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    superAdminApi.get("/super-admin/overview").then((res) => setData(res.data)).catch(() => {});
  }, []);

  const growthDelta = useMemo(() => {
    if (!data?.growth || data.growth.length < 2) return null;
    const last = data.growth[data.growth.length - 1].count;
    const prev = data.growth[data.growth.length - 2].count;
    if (prev === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - prev) / prev) * 1000) / 10;
  }, [data]);

  const activeRatio = useMemo(() => {
    if (!data || !data.totalTenants) return 0;
    return Math.round((data.payingTenants / data.totalTenants) * 100);
  }, [data]);

  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  if (!data) {
    return (
      <div className="p-5 md:p-8 max-w-7xl">
        <div className="h-8 w-64 bg-slate-200/70 rounded-lg animate-pulse" />
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Doanh thu định kỳ (MRR)",
      value: fmtVnd(data.mrr),
      icon: DollarSign,
      iconBg: "bg-blue-50",
      iconTone: "text-blue-600",
      sub: `Tính từ ${data.payingTenants} khách đang trả phí`,
    },
    {
      label: "Khách thuê đang trả phí",
      value: data.payingTenants,
      icon: Users,
      iconBg: "bg-indigo-50",
      iconTone: "text-indigo-600",
      ratio: activeRatio,
    },
    {
      label: "Tỷ lệ rời bỏ (Churn)",
      value: `${data.churnRate}%`,
      icon: TrendingDown,
      iconBg: data.churnRate >= 5 ? "bg-red-50" : "bg-amber-50",
      iconTone: data.churnRate >= 5 ? "text-red-600" : "text-amber-600",
      hint: data.note,
    },
    {
      label: "Chip NFC đã kích hoạt",
      value: data.totalTagsActivated,
      icon: Nfc,
      iconBg: "bg-violet-50",
      iconTone: "text-violet-600",
      sub: "Trên toàn nền tảng",
    },
  ];

  return (
    <div className="p-5 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{greeting()}, Super Admin 👋</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng <span className="font-medium text-slate-700">{data.totalTenants}</span> tài khoản khách thuê đã đăng ký.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200/80 rounded-full px-3.5 py-1.5 capitalize">
          {today}
        </span>
      </div>

      {/* KPI Bento cards */}
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={i}
            className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <span className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconTone} flex items-center justify-center`}>
                <c.icon size={18} />
              </span>
              {i === 1 && growthDelta !== null && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-1 ${
                    growthDelta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  }`}
                >
                  {growthDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(growthDelta)}%
                </span>
              )}
              {c.hint && (
                <span className="relative group/tip">
                  <Info size={14} className="text-slate-300 hover:text-slate-500 cursor-help" />
                  <span className="pointer-events-none absolute right-0 top-6 w-52 text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
                    {c.hint}
                  </span>
                </span>
              )}
            </div>

            <div className="mt-4 text-2xl font-semibold text-slate-900 [font-variant-numeric:tabular-nums]">{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>

            {c.sub && <div className="text-xs text-slate-400 mt-2">{c.sub}</div>}

            {typeof c.ratio === "number" && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${c.ratio}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1.5">{c.ratio}% trên tổng {data.totalTenants} tài khoản</div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Analytics: Area chart + Donut + Activity */}
      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm"
        >
          <h2 className="font-medium text-slate-900 mb-1">Tài khoản mới theo tháng</h2>
          <p className="text-xs text-slate-400 mb-4">6 tháng gần nhất</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growth}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
                  labelStyle={{ color: "#0F172A", fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="count" name="Tài khoản mới" stroke="#2563EB" strokeWidth={2.5} fill="url(#mrrGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-4">
          {/* Donut: Plan distribution */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h2 className="font-medium text-slate-900 mb-3">Phân bổ theo gói</h2>
            {data.planDistribution?.length ? (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.planDistribution}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {data.planDistribution.map((d) => (
                          <Cell key={d.planKey} fill={PLAN_COLORS[d.planKey] || "#94A3B8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1.5">
                  {data.planDistribution.map((d) => (
                    <div key={d.planKey} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[d.planKey] || "#94A3B8" }} />
                        {d.name}
                      </span>
                      <span className="font-medium text-slate-900">{d.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">Chưa có dữ liệu</p>
            )}
          </motion.div>

          {/* Activity feed */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h2 className="font-medium text-slate-900 mb-3">Hoạt động hệ thống</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {data.recentActivity?.length ? (
                data.recentActivity.map((a, i) => {
                  const meta = ACTIVITY_META[a.type] || ACTIVITY_META.signup;
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-full ${meta.bg} ${meta.tone} flex items-center justify-center shrink-0`}>
                        <Icon size={13} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-600 leading-snug">{a.text}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(a.at)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">Chưa có hoạt động nào</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
