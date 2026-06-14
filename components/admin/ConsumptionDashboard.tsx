"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Zap, Users, Activity, AlertCircle, Loader2, Download,
  Leaf, Banknote, Calendar, Search,
} from "lucide-react";
import { RANGE_LABELS, type RangeKey } from "@/lib/date-ranges";
import { UserSearchSelect } from "./UserSearchSelect";
import { PeakHoursHeatmap } from "./PeakHoursHeatmap";
import { CarMakeLinesChart } from "./CarMakeLinesChart";
import { SessionListModal } from "./SessionListModal";
import { UserDetailModal } from "./UserDetailModal";
import { StationDetailModal } from "./StationDetailModal";

type Totals = {
  energyWh: number; sessions: number; users: number; durationSec: number;
  co2SavedKg: number; costMur: number;
};
type Data = {
  totals: Totals;
  byUser: any[];
  byDepartment: any[];
  byMake: any[];
  byDay: { date: string; energyWh: number }[];
  byMakeOverTime: { make: string; data: { date: string; energyWh: number }[] }[];
  byStation: any[];
  heatmap: Record<string, number>;
};
type FilterOptions = {
  users: { id: number; name: string; employeeId: string | null }[];
  departments: string[];
  makes: string[];
  modelsByMake: Record<string, string[]>;
  years: number[];
};

const PRIMARY = "hsl(150 84% 42%)";

export function ConsumptionDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [range, setRange] = useState<RangeKey>("month");
  const [userId, setUserId] = useState<number | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [carMake, setCarMake] = useState<string | null>(null);
  const [carModel, setCarModel] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState("");

  // Drilldown modals
  const [sessionListOpen, setSessionListOpen] = useState(false);
  const [sessionListInitialDate, setSessionListInitialDate] = useState<string | null>(null);
  const [userDetailId, setUserDetailId] = useState<number | null>(null);
  const [stationDetail, setStationDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/filter-options")
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => setOptions(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = new URL("/api/admin/consumption", window.location.origin);
    url.searchParams.set("range", range);
    if (userId) url.searchParams.set("userId", String(userId));
    if (department) url.searchParams.set("department", department);
    if (carMake) url.searchParams.set("carMake", carMake);
    if (carModel) url.searchParams.set("carModel", carModel);

    fetch(url.toString())
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load");
        }
        return r.json();
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [range, userId, department, carMake, carModel]);

  function clearFilters() {
    setUserId(null);
    setDepartment(null);
    setCarMake(null);
    setCarModel(null);
  }

  function openSessionsForDate(date: string | null) {
    setSessionListInitialDate(date);
    setSessionListOpen(true);
  }

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["User", "Department", "Job title", "Car", "Sessions", "Energy (kWh)"],
      ...data.byUser.map((u: any) => [
        u.name, u.department ?? "", u.jobTitle ?? "",
        u.carMake ? `${u.carMake} ${u.carModel ?? ""}` : "",
        String(u.sessions), ((u.energyWh ?? 0) / 1000).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evolve-consumption-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-red-900">Could not load</div>
          <div className="text-sm text-red-700 mt-1">{error}</div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = userId || department || carMake || carModel;
  const availableModels = carMake ? options?.modelsByMake[carMake] ?? [] : [];

  // For bottom-consumers panel — least energy per user
  const bottomUsers = data?.byUser ? [...data.byUser].sort((a, b) => a.energyWh - b.energyWh).slice(0, 15) : [];
  // Most efficient cars — least energy per session by car make
  const carEfficiency = data?.byMake?.map((m: any) => ({
    make: m.make,
    kwhPerSession: m.sessions > 0 ? (m.energyWh / m.sessions) / 1000 : 0,
    sessions: m.sessions,
  })).sort((a: any, b: any) => a.kwhPerSession - b.kwhPerSession).slice(0, 15) ?? [];

  return (
    <div className="space-y-5">
      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range presets */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(["today", "week", "month", "ytd", "all"] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Session date search */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                if (e.target.value) openSessionsForDate(e.target.value);
              }}
              className="bg-transparent text-xs border-0 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">find day's sessions</span>
          </div>

          {options && <UserSearchSelect users={options.users} value={userId} onChange={setUserId} />}

          <select
            value={department ?? ""}
            onChange={(e) => setDepartment(e.target.value || null)}
            className="bg-white border border-slate-300 rounded-lg text-xs px-3 py-1.5"
          >
            <option value="">All departments</option>
            {options?.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={carMake ?? ""}
            onChange={(e) => { setCarMake(e.target.value || null); setCarModel(null); }}
            className="bg-white border border-slate-300 rounded-lg text-xs px-3 py-1.5"
          >
            <option value="">All makes</option>
            {options?.makes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={carModel ?? ""}
            onChange={(e) => setCarModel(e.target.value || null)}
            disabled={!carMake}
            className="bg-white border border-slate-300 rounded-lg text-xs px-3 py-1.5 disabled:opacity-50"
          >
            <option value="">All models</option>
            {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1">
              Clear filters
            </button>
          )}

          <div className="ml-auto">
            <button
              onClick={exportCsv}
              disabled={!data}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* STAT CARDS (clickable) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <ClickableStatCard
          icon={<Zap className="w-4 h-4" />}
          label="Total energy"
          value={loading || !data ? "—" : `${(data.totals.energyWh / 1000).toFixed(1)} kWh`}
          color="emerald"
          hint="See chart"
          onClick={() => {
            // Scroll to energy over time chart
            document.getElementById("energy-over-time")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
        <ClickableStatCard
          icon={<Activity className="w-4 h-4" />}
          label="Sessions"
          value={loading || !data ? "—" : String(data.totals.sessions)}
          color="blue"
          hint="View list"
          onClick={() => { setSessionListInitialDate(null); setSessionListOpen(true); }}
        />
        <ClickableStatCard
          icon={<Users className="w-4 h-4" />}
          label="Active users"
          value={loading || !data ? "—" : String(data.totals.users)}
          color="slate"
          hint="See top users"
          onClick={() => document.getElementById("top-users")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
        <ClickableStatCard
          icon={<Leaf className="w-4 h-4" />}
          label="CO₂ saved"
          value={loading || !data ? "—" : `${data.totals.co2SavedKg.toFixed(0)} kg`}
          color="emerald"
          sub="vs petrol"
        />
        <ClickableStatCard
          icon={<Banknote className="w-4 h-4" />}
          label="Energy cost"
          value={loading || !data ? "—" : `MUR ${data.totals.costMur.toFixed(0)}`}
          color="amber"
          sub="@ 9.5/kWh"
        />
      </div>

      {/* ENERGY OVER TIME */}
      <Panel id="energy-over-time" title="Energy over time" subtitle="kWh by day · click a point to view that day's sessions">
        <div className="h-64">
          {loading ? <Skeleton /> : data && data.byDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.byDay.map((d) => ({ date: d.date, kwh: d.energyWh / 1000 }))}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Energy"]}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="kwh"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PRIMARY, cursor: "pointer" }}
                  activeDot={{
                    r: 6,
                    onClick: (_: any, payload: any) => {
                      const date = payload?.payload?.date;
                      if (date) openSessionsForDate(date);
                    },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>
      </Panel>

      {/* CAR MAKE LINES — multi-line per make */}
      <Panel title="Energy by car make over time" subtitle="One line per brand · hover for details">
        {loading ? <Skeleton className="h-80" /> : data ? (
          <CarMakeLinesChart series={data.byMakeOverTime ?? []} />
        ) : <Empty />}
      </Panel>

      {/* DEPARTMENT + MAKE bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Energy by car make" subtitle="kWh per brand · click to filter">
          <div className="h-72">
            {loading ? <Skeleton /> : data && data.byMake.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byMake.map((m: any) => ({ name: m.make, kwh: m.energyWh / 1000 }))}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={90} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Energy"]} />
                  <Bar
                    dataKey="kwh"
                    radius={[0, 4, 4, 0]}
                    onClick={(e: any) => setCarMake(e?.name ?? null)}
                    cursor="pointer"
                  >
                    {data.byMake.map((m: any, i: number) => (
                      <Cell key={i} fill={m.make === carMake ? "#0d9b6c" : PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
        </Panel>

        <Panel title="Energy by department" subtitle="kWh per department · click to filter">
          <div className="h-72">
            {loading ? <Skeleton /> : data && data.byDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDepartment.map((d: any) => ({ name: d.department, kwh: d.energyWh / 1000 }))}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Energy"]} />
                  <Bar
                    dataKey="kwh"
                    radius={[6, 6, 0, 0]}
                    onClick={(e: any) => setDepartment(e?.name ?? null)}
                    cursor="pointer"
                  >
                    {data.byDepartment.map((d: any, i: number) => (
                      <Cell key={i} fill={d.department === department ? "#0d9b6c" : PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
        </Panel>
      </div>

      {/* TOP USERS + MOST-EFFICIENT CARS — side by side scrollable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="top-users">
        <Panel title="Top consumers" subtitle="Users sorted by energy used · click to filter or open profile">
          <ScrollableUserList
            users={data?.byUser ?? []}
            loading={loading}
            selectedUserId={userId}
            onSelect={setUserId}
            onOpen={(id) => setUserDetailId(id)}
          />
        </Panel>

        <Panel title="Most efficient cars" subtitle="Lowest kWh per session by brand">
          <ScrollableEfficiencyList rows={carEfficiency} loading={loading} />
        </Panel>
      </div>

      {/* PEAK HOURS HEATMAP */}
      <Panel title="Peak hours" subtitle="Sessions by hour, Monday to Friday">
        {loading || !data ? <Skeleton className="h-40" /> : <PeakHoursHeatmap heatmap={data.heatmap} />}
      </Panel>

      {/* STATION UTILIZATION (clickable rows) */}
      <Panel title="Station utilization" subtitle="Click any station to drill in">
        {loading || !data ? <Skeleton className="h-40" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-3 py-2 font-semibold">Station</th>
                <th className="px-3 py-2 font-semibold text-right">Sessions</th>
                <th className="px-3 py-2 font-semibold text-right">Energy</th>
                <th className="px-3 py-2 font-semibold text-right">Hours occupied</th>
              </tr>
            </thead>
            <tbody>
              {data.byStation.map((s: any) => (
                <tr
                  key={s.stationIdentity}
                  className="border-b border-slate-100 last:border-0 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => setStationDetail(s.stationIdentity)}
                  title={`Click to see ${s.stationIdentity} details`}
                >
                  <td className="px-3 py-2 font-mono text-slate-900">{s.stationIdentity}</td>
                  <td className="px-3 py-2 text-right text-slate-700 tabular-nums">{s.sessions}</td>
                  <td className="px-3 py-2 text-right text-slate-900 font-mono tabular-nums">
                    {(s.energyWh / 1000).toFixed(1)} kWh
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                    {(s.occupiedSec / 3600).toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* MODALS */}
      <SessionListModal
        open={sessionListOpen}
        onClose={() => { setSessionListOpen(false); setSessionListInitialDate(null); }}
        initialDate={sessionListInitialDate}
        initialUserId={userId}
      />
      <UserDetailModal userId={userDetailId} onClose={() => setUserDetailId(null)} />
      <StationDetailModal stationIdentity={stationDetail} onClose={() => setStationDetail(null)} />
    </div>
  );
}

function ClickableStatCard({
  icon, label, value, color, sub, hint, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "slate" | "amber";
  sub?: string;
  hint?: string;
  onClick?: () => void;
}) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  }[color];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`bg-white border border-slate-200 rounded-xl p-4 text-left transition-all ${
        onClick ? "hover:border-slate-300 hover:shadow-sm cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${palette}`}>{icon}</div>
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
      {hint && onClick && (
        <div className="text-[10px] text-primary font-semibold mt-1.5 inline-flex items-center gap-1">
          {hint} →
        </div>
      )}
    </button>
  );
}

function ScrollableUserList({ users, loading, selectedUserId, onSelect, onOpen }: {
  users: any[];
  loading: boolean;
  selectedUserId: number | null;
  onSelect: (id: number | null) => void;
  onOpen: (id: number) => void;
}) {
  if (loading) return <Skeleton className="h-72" />;
  if (users.length === 0) return <Empty />;
  return (
    <div className="max-h-72 overflow-y-auto -mx-2 px-2">
      <div className="space-y-1">
        {users.map((u, i) => (
          <div
            key={u.userId}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              selectedUserId === u.userId ? "bg-emerald-50 border border-emerald-300" : "hover:bg-slate-50"
            }`}
          >
            <div className="text-xs text-slate-400 w-6 tabular-nums">{i + 1}</div>
            <button
              onClick={() => onSelect(selectedUserId === u.userId ? null : u.userId)}
              className="flex-1 text-left"
            >
              <div className="text-sm font-medium text-slate-900 truncate">{u.name}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {u.department ?? "—"}
                {u.carMake && <> · {u.carMake} {u.carModel}</>}
              </div>
            </button>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                {(u.energyWh / 1000).toFixed(1)} kWh
              </div>
              <div className="text-[10px] text-slate-500">{u.sessions} sessions</div>
            </div>
            <button
              onClick={() => onOpen(u.userId)}
              className="text-[10px] text-slate-500 hover:text-slate-900 hover:bg-white px-2 py-1 rounded border border-slate-200"
              title="View profile"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollableEfficiencyList({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-72" />;
  if (rows.length === 0) return <Empty />;
  return (
    <div className="max-h-72 overflow-y-auto -mx-2 px-2">
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={r.make} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
            <div className="text-xs text-slate-400 w-6 tabular-nums">{i + 1}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{r.make}</div>
              <div className="text-[11px] text-slate-500">{r.sessions} sessions tracked</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-blue-700 tabular-nums">
                {r.kwhPerSession.toFixed(2)} kWh
              </div>
              <div className="text-[10px] text-slate-500">per session avg</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ id, title, subtitle, children }: { id?: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white border border-slate-200 rounded-xl p-5 scroll-mt-6">
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{title}</div>
        {subtitle && <div className="text-sm text-slate-600 mt-1">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Skeleton({ className = "h-full" }: { className?: string }) {
  return <div className={`w-full bg-slate-50 rounded animate-pulse ${className}`} />;
}

function Empty() {
  return (
    <div className="w-full h-full flex items-center justify-center text-sm text-slate-400 py-8">
      No data in this range.
    </div>
  );
}