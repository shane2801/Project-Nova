"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Zap, Activity, AlertCircle, Banknote, User as UserIcon, Car, Calendar } from "lucide-react";

type Detail = {
  user: {
    id: number;
    name: string;
    email: string;
    employeeId: string | null;
    department: string | null;
    jobTitle: string | null;
    joinedAt: string | null;
    carMake: string | null;
    carModel: string | null;
    carYear: number | null;
    carPlate: string | null;
    rfidTag: string;
  };
  stats: {
    sessionCount: number;
    bookingsCount: number;
    noShows: number;
    totalKwh: number;
    totalCostMur: number;
  };
  recentSessions: any[];
  recentBookings: any[];
};

export function UserDetailModal({
  userId,
  onClose,
}: {
  userId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setData(null); return; }
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
              {data?.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                User profile
              </div>
              <div className="text-lg font-semibold text-slate-900 mt-0.5">
                {data?.user.name ?? "Loading…"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading || !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatBox icon={<Zap className="w-4 h-4" />} label="Energy used" value={`${data.stats.totalKwh.toFixed(1)} kWh`} color="emerald" />
                <StatBox icon={<Activity className="w-4 h-4" />} label="Sessions" value={String(data.stats.sessionCount)} color="blue" />
                <StatBox icon={<AlertCircle className="w-4 h-4" />} label="No-shows" value={String(data.stats.noShows)} color="amber" />
                <StatBox icon={<Banknote className="w-4 h-4" />} label="Energy cost" value={`MUR ${data.stats.totalCostMur.toFixed(0)}`} color="slate" />
              </div>

              {/* Profile */}
              <Section icon={<UserIcon className="w-4 h-4" />} title="Profile">
                <Row label="Email" value={data.user.email} />
                <Row label="Employee ID" value={data.user.employeeId ?? "—"} mono />
                <Row label="Department" value={data.user.department ?? "—"} />
                <Row label="Job title" value={data.user.jobTitle ?? "—"} />
                <Row label="Joined" value={
                  data.user.joinedAt
                    ? new Date(data.user.joinedAt).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })
                    : "—"
                } />
                <Row label="RFID tag" value={data.user.rfidTag} mono />
              </Section>

              {/* Vehicle */}
              <Section icon={<Car className="w-4 h-4" />} title="Vehicle">
                <Row label="Make / Model" value={
                  data.user.carMake ? `${data.user.carMake} ${data.user.carModel ?? ""}` : "—"
                } />
                <Row label="Year" value={data.user.carYear ? String(data.user.carYear) : "—"} />
                <Row label="Plate" value={data.user.carPlate ?? "—"} mono />
              </Section>

              {/* Recent sessions */}
              <Section icon={<Calendar className="w-4 h-4" />} title="Recent activity">
                {data.recentSessions.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-4">No sessions yet.</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="py-1 px-2 font-semibold">Date</th>
                        <th className="py-1 px-2 font-semibold">Station</th>
                        <th className="py-1 px-2 font-semibold text-right">Duration</th>
                        <th className="py-1 px-2 font-semibold text-right">Energy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSessions.slice(0, 10).map((s: any) => (
                        <tr key={s.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 px-2 text-slate-700">{new Date(s.startTime).toLocaleDateString()}</td>
                          <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600">{s.stationIdentity}</td>
                          <td className="py-1.5 px-2 text-right text-slate-700 tabular-nums">
                            {Math.round(s.durationSec / 60)}m
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                            {(s.energyWh / 1000).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
        {icon}
        {title}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">{children}</div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "amber" | "slate";
}) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium text-slate-900 text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}