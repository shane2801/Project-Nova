"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Search, Loader2, Zap } from "lucide-react";
import { SessionDetailModal } from "./SessionDetailModal";

type Session = {
  id: number;
  userId: number;
  userNameSnap: string;
  carMakeSnap: string | null;
  carModelSnap: string | null;
  carYearSnap: number | null;
  stationIdentity: string;
  connectorId: number;
  startTime: string;
  stopTime: string | null;
  energyWh: number;
  durationSec: number;
  departmentSnap: string | null;
};

export function SessionListModal({
  open,
  onClose,
  initialDate,
  initialUserId,
  initialStationIdentity,
}: {
  open: boolean;
  onClose: () => void;
  initialDate?: string | null;
  initialUserId?: number | null;
  initialStationIdentity?: string | null;
}) {
  const [date, setDate] = useState<string>(initialDate ?? "");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setDate(initialDate ?? "");
      load(initialDate ?? "");
    }
  }, [open, initialDate]);

  async function load(d: string) {
    setLoading(true);
    const url = new URL("/api/admin/sessions", window.location.origin);
    if (d) url.searchParams.set("date", d);
    if (initialUserId) url.searchParams.set("userId", String(initialUserId));
    if (initialStationIdentity) url.searchParams.set("stationIdentity", initialStationIdentity);
    url.searchParams.set("limit", "300");
    try {
      const res = await fetch(url.toString());
      const json = await res.json();
      setSessions(json.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Charging sessions
              </div>
              <div className="text-lg font-semibold text-slate-900 mt-0.5">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                {date && ` on ${new Date(date).toLocaleDateString()}`}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                load(e.target.value);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
            />
            {date && (
              <button
                onClick={() => { setDate(""); load(""); }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear date
              </button>
            )}
            <div className="ml-auto text-xs text-slate-500">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin inline" />} Click any row for details
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                No sessions found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-slate-200">
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">Vehicle</th>
                    <th className="px-4 py-2 font-semibold">Station</th>
                    <th className="px-4 py-2 font-semibold">Started</th>
                    <th className="px-4 py-2 font-semibold text-right">Duration</th>
                    <th className="px-4 py-2 font-semibold text-right">Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const start = new Date(s.startTime);
                    const durationMin = Math.round(s.durationSec / 60);
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-emerald-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedId(s.id)}
                      >
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-900">{s.userNameSnap}</div>
                          {s.departmentSnap && (
                            <div className="text-[11px] text-slate-500">{s.departmentSnap}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {s.carMakeSnap ? (
                            <>
                              {s.carMakeSnap} {s.carModelSnap}
                              {s.carYearSnap && (
                                <span className="text-slate-400"> · {s.carYearSnap}</span>
                              )}
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-mono text-xs text-slate-700">{s.stationIdentity}</div>
                          <div className="text-[11px] text-slate-500">Conn {s.connectorId}</div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          <div>{start.toLocaleDateString()}</div>
                          <div className="font-mono text-xs text-slate-500">
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700 tabular-nums">
                          {durationMin}m
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                          <span className="inline-flex items-center gap-1 justify-end">
                            <Zap className="w-3 h-3" />
                            {(s.energyWh / 1000).toFixed(2)} kWh
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <SessionDetailModal
        sessionId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}