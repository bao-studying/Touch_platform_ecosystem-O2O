import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  DollarSign,
  RefreshCw,
  Download,
  Layers,
  TrendingUp,
  TrendingDown,
  Nfc,
  Info,
} from "lucide-react";
import superAdminApi from "../../api/superAdminAxios";
import { fmtVnd, fmtCompactVnd, timeAgo, ACTIVITY_META, PLAN_COLORS } from "../../lib/superadminFormat";

const RANGES = [3, 6, 12];

function GaugeArc({ percent, color = "#34D399" }) {
  const r = 80;
  const cx = 100;
  const cy = 100;
  const arcLen = Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const angle = Math.PI - (pct / 100) * Math.PI;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy - r * Math.sin(angle);
  return (
    <svg viewBox="0 0 200 115" className="w-full max-w-[220px]">
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="#262626" strokeWidth={14} strokeLinecap="round" />
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={arcLen}
        strokeDashoffset={arcLen * (1 - pct / 100)}
      />
      <circle cx={dotX} cy={dotY} r={9} fill="#0A0A0A" stroke={color} strokeWidth={4} />
    </svg>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-neutral-950/95 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs shadow-xl">
      <div className="text-white/50">{p.label}</div>
      <div className="text-white font-semibold mt-0.5">{p.count} tài khoản mới</div>
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [months, setMonths] = useState(6);
  const [plans, setPlans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = (m) => {
    setRefreshing(true);
    return superAdminApi
      .get("/super-admin/overview", { params: { months: m } })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    load(months);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  useEffect(() => {
    superAdminApi.get("/super-admin/plans").then((res) => setPlans(Array.isArray(res.data) ? res.data : [])).catch(() => {});
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

  const maxAlloc = useMemo(() => Math.max(1, ...(data?.planDistribution || []).map((d) => d.count)), [data]);

  const priceByPlan = useMemo(() => Object.fromEntries(plans.map((p) => [p.planKey, p.priceVnd])), [plans]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ["Chỉ số", "Giá trị"],
      ["MRR", data.mrr],
      ["Khách đang trả phí", data.payingTenants],
      ["Tổng khách thuê", data.totalTenants],
      ["Churn rate (%)", data.churnRate],
      ["Chip NFC đã kích hoạt", data.totalTagsActivated],
      ...data.planDistribution.map((p) => [`Gói ${p.name}`, p.count]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tong-quan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return (
      <div className="p-5 md:p-8">
        <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse" />
        <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const latestActivity = data.recentActivity?.[0];

  return (
    <div className="p-4 sm:p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tổng quan nền tảng</h1>
          <p className="text-sm text-neutral-500 mt-1">{data.totalTenants} khách thuê đã đăng ký</p>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 bg-neutral-900 border border-white/5 rounded-full px-4 py-2.5">
          <div className="flex items-end gap-0.5 h-4">
            {data.growth.map((g, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-amber-400/70"
                style={{ height: `${Math.max(15, (g.count / Math.max(1, ...data.growth.map((x) => x.count))) * 100)}%` }}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-400 whitespace-nowrap">
            {data.growth[data.growth.length - 1]?.count || 0} khách mới tháng này
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => load(months)}
            className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 hover:bg-white/5 flex items-center justify-center transition-colors"
            aria-label="Làm mới"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExportCsv}
            className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 hover:bg-white/5 flex items-center justify-center transition-colors"
            aria-label="Xuất CSV"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Hero row */}
      <div className="mt-5 grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Left: MRR + plan mini-grid */}
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
            <p className="text-xs text-neutral-500 flex items-center gap-1.5">
              <DollarSign size={13} /> Doanh thu định kỳ (MRR)
            </p>
            <div className="text-[26px] sm:text-3xl font-semibold mt-2 tracking-tight">{fmtVnd(data.mrr)}</div>
            <p className="text-xs text-neutral-500 mt-2">Từ {data.payingTenants} khách đang trả phí</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {data.planDistribution.map((p) => (
              <div key={p.planKey} className="bg-neutral-900 border border-white/5 rounded-2xl p-4">
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className="w-1 h-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.planKey] }} />
                  {p.name}
                </span>
                <div className="text-lg font-semibold mt-1.5">{p.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: hero orange growth card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-600 to-red-600 p-5 sm:p-6 shadow-glow-orange overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-white/70 font-medium">Tăng trưởng khách thuê</p>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">{data.totalTenants}</span>
                {growthDelta !== null && (
                  <span className="flex items-center gap-1 bg-white text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {growthDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(growthDelta)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-0.5 bg-black/20 rounded-full p-1">
              {RANGES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    months === m ? "bg-white text-orange-600" : "text-white/70 hover:text-white"
                  }`}
                >
                  {m}T
                </button>
              ))}
            </div>
          </div>

          <div className="h-52 sm:h-60 mt-4 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growth}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD874" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FFD874" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#FFD874" strokeWidth={2.5} fill="url(#growthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plan ticker row */}
      <div className="mt-4 bg-neutral-900 border border-white/5 rounded-[28px] sm:rounded-full px-5 py-3.5 flex flex-wrap items-center gap-x-7 gap-y-3 overflow-x-auto">
        <span className="text-xs text-neutral-500 font-medium shrink-0">Gói nền tảng</span>
        {data.planDistribution.map((p) => (
          <div key={p.planKey} className="flex items-center gap-2.5 shrink-0">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${PLAN_COLORS[p.planKey]}22`, color: PLAN_COLORS[p.planKey] }}
            >
              <Layers size={14} />
            </span>
            <div>
              <div className="text-sm font-medium leading-tight">{p.name}</div>
              <div className="text-xs text-neutral-500 leading-tight">
                {p.count} khách · {priceByPlan[p.planKey] ? fmtCompactVnd(priceByPlan[p.planKey]) : "Miễn phí"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        {/* Allocation bars */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
          <h2 className="font-medium text-sm">Phân bổ theo gói</h2>
          <div className="flex items-end justify-between gap-3 h-36 mt-5">
            {data.planDistribution.map((p) => {
              const pct = Math.round((p.count / maxAlloc) * 100);
              const isTop = p.count === maxAlloc;
              return (
                <div key={p.planKey} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-neutral-400">{p.count}</span>
                  <div className="w-full rounded-xl bg-white/5 flex items-end overflow-hidden" style={{ height: 88 }}>
                    <div
                      className="w-full rounded-xl transition-all"
                      style={{ height: `${Math.max(10, pct)}%`, backgroundColor: isTop ? "#F59E0B" : PLAN_COLORS[p.planKey] }}
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500 truncate max-w-full">{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gauge */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between">
            <h2 className="font-medium text-sm">Tỷ lệ khách trả phí</h2>
            <span className="relative group/tip">
              <Info size={13} className="text-neutral-600 hover:text-neutral-400 cursor-help" />
              <span className="pointer-events-none absolute right-0 top-6 w-52 text-[11px] leading-relaxed text-neutral-300 bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
                {data.payingTenants} / {data.totalTenants} tài khoản đang ở gói trả phí (không tính Free).
              </span>
            </span>
          </div>
          <div className="mt-1">
            <GaugeArc percent={activeRatio} color="#34D399" />
          </div>
          <div className="-mt-8 text-center">
            <span className="text-3xl font-semibold">{activeRatio}</span>
            <span className="text-neutral-500 text-sm">/100</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            {data.payingTenants}/{data.totalTenants} khách đang trả phí
          </p>
        </div>

        {/* Activity */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
          <h2 className="font-medium text-sm flex items-center gap-2">
            <Nfc size={15} className="text-violet-400" /> Hoạt động hệ thống
          </h2>
          {latestActivity ? (
            <p className="text-sm text-neutral-300 leading-relaxed mt-3">
              <span className="font-semibold text-white">{latestActivity.text}</span> — {timeAgo(latestActivity.at)}.
            </p>
          ) : (
            <p className="text-sm text-neutral-500 mt-3">Chưa có hoạt động nào gần đây.</p>
          )}
          <div className="flex items-center gap-2 mt-4">
            {(data.recentActivity || []).slice(0, 6).map((a, i) => {
              const meta = ACTIVITY_META[a.type] || ACTIVITY_META.signup;
              const Icon = meta.icon;
              return (
                <span
                  key={i}
                  title={a.text}
                  className={`w-8 h-8 rounded-full ${meta.darkBg} ${meta.darkTone} flex items-center justify-center`}
                >
                  <Icon size={13} />
                </span>
              );
            })}
            {(!data.recentActivity || data.recentActivity.length === 0) && (
              <span className="text-xs text-neutral-600">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
