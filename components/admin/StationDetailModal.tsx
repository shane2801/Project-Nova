"use client";

import { useEffect, useState } from "react";
import { X, Loader2, MapPin, Activity, Clock, Zap, Calendar } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type Detail = {
  stationIdentity: string;
  totals: { sessions: number; energyWh: number; occupiedSec: number };
  byDay: { date: string; sessions: number; energyWh: number }[];
};

export function StationDetailModal({
  stationIdentity,
  onClose,
}: {
  stationIdentity: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    if (!stationIdentity) return;
    setLoading(true);
    const url = new URL(`/api/admin/station/${encodeURIComponent(stationIdentity)}`, window.location.origin);
    if (from) url.searchParams.set("from", new Date(from + "T00:00:00").toISOString());
    if (to) url.searchParams.set("to", new Date(to + "T23:59:59").toISOString());
    const res = await fetch(url.toString());
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    if (stationIdentity) {
      setFrom(""); setTo(""); setData(null);
      load();
    }
  }, [stationIdentity]);

  if (!stationIdentity) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Charger station
              </div>
              <div className="text-lg font-semibold text-slate-900 mt-0.5 font-mono">
                {stationIdentity}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
          <Calendar className="w-4 h-4 text-slate-500" />
          <label className="text-xs text-slate-600">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs" />
          <label className="text-xs text-slate-600">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs" />
          <button onClick={load}
            className="bg-primary hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-semibold">
            Apply
          </button>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); load(); }}
              className="text-xs text-slate-500 hover:text-slate-700">
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading || !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Stat icon={<Activity className="w-4 h-4" />} label="Sessions" value={String(data.totals.sessions)} color="blue" />
                <Stat icon={<Zap className="w-4 h-4" />} label="Energy" value={`${(data.totals.energyWh / 1000).toFixed(1)} kWh`} color="emerald" />
                <Stat icon={<Clock className="w-4 h-4" />} label="Hours occupied" value={`${(data.totals.occupiedSec / 3600).toFixed(1)}h`} color="slate" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Sessions over time
                </div>
                {data.byDay.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                    No sessions in this range.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.byDay}>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const p = payload[0].payload;
                            return (
                              <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                                <div className="font-semibold text-slate-900 mb-1">
                                  {new Date(p.date).toLocaleDateString()}
                                </div>
                                <div className="text-slate-700">Sessions: <span className="font-mono font-semibold">{p.sessions}</span></div>
                                <div className="text-emerald-700">Energy: <span className="font-mono font-semibold">{(p.energyWh / 1000).toFixed(2)} kWh</span></div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="sessions" fill="hsl(150 84% 42%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "slate";
}) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  }[color];
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-6 h-6 rounded border flex items-center justify-center ${palette}`}>{icon}</div>
        <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}