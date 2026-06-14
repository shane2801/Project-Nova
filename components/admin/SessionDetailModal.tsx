"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Zap, Calendar, Plug, MapPin, Car, User as UserIcon, AlertCircle } from "lucide-react";

type Detail = {
  session: {
    id: number;
    userId: number;
    userNameSnap: string;
    userEmailSnap: string;
    employeeIdSnap: string | null;
    departmentSnap: string | null;
    jobTitleSnap: string | null;
    carMakeSnap: string | null;
    carModelSnap: string | null;
    carYearSnap: number | null;
    stationIdentity: string;
    connectorId: number;
    startTime: string;
    stopTime: string | null;
    energyWh: number;
    durationSec: number;
    source: string;
  };
  booking: {
    id: number;
    startAt: string;
    endAt: string;
    status: string;
  } | null;
};

export function SessionDetailModal({
  sessionId,
  onClose,
}: {
  sessionId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/sessions/${sessionId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Session detail
            </div>
            <div className="text-lg font-semibold text-slate-900 mt-0.5 font-mono">
              #{sessionId}
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
              {/* Headline kWh */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-xl p-5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-700 font-semibold mb-2">
                  <Zap className="w-3 h-3" />
                  Energy delivered
                </div>
                <div className="font-mono text-5xl font-bold tracking-tight text-emerald-700 tabular-nums">
                  {(data.session.energyWh / 1000).toFixed(3)}
                </div>
                <div className="text-sm font-semibold text-emerald-700 mt-1">kWh</div>
                <div className="text-xs text-slate-500 mt-2">
                  ≈ MUR {(data.session.energyWh / 1000 * 9.5).toFixed(0)} at retail rate
                </div>
              </div>

              {/* Section: User */}
              <Section icon={<UserIcon className="w-4 h-4" />} title="User">
                <Row label="Name" value={data.session.userNameSnap} />
                <Row label="Email" value={data.session.userEmailSnap} />
                <Row label="Employee ID" value={data.session.employeeIdSnap ?? "—"} mono />
                <Row label="Department" value={data.session.departmentSnap ?? "—"} />
                <Row label="Job title" value={data.session.jobTitleSnap ?? "—"} />
              </Section>

              {/* Section: Vehicle */}
              <Section icon={<Car className="w-4 h-4" />} title="Vehicle (at time of session)">
                <Row label="Make / Model" value={
                  data.session.carMakeSnap
                    ? `${data.session.carMakeSnap} ${data.session.carModelSnap ?? ""}`
                    : "—"
                } />
                <Row label="Year" value={data.session.carYearSnap ? String(data.session.carYearSnap) : "—"} />
              </Section>

              {/* Section: Charger */}
              <Section icon={<MapPin className="w-4 h-4" />} title="Charger">
                <Row label="Station" value={data.session.stationIdentity} mono />
                <Row label="Connector" value={`#${data.session.connectorId}`} />
              </Section>

              {/* Section: Session timing */}
              <Section icon={<Calendar className="w-4 h-4" />} title="Session timing">
                <Row label="Started" value={new Date(data.session.startTime).toLocaleString()} />
                <Row label="Ended" value={
                  data.session.stopTime
                    ? new Date(data.session.stopTime).toLocaleString()
                    : "— (still active)"
                } />
                <Row label="Duration" value={`${Math.round(data.session.durationSec / 60)} min`} />
                <Row label="Source" value={data.session.source === "real" ? "Live (CSMS)" : "Seeded (demo)"} />
              </Section>

              {/* Section: Booking link */}
              {data.booking ? (
                <Section icon={<Plug className="w-4 h-4" />} title="Linked booking">
                  <Row label="Booking ID" value={`#${data.booking.id}`} mono />
                  <Row label="Window" value={
                    `${new Date(data.booking.startAt).toLocaleString()} → ${new Date(data.booking.endAt).toLocaleString()}`
                  } />
                  <Row label="Status" value={data.booking.status} />
                </Section>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <div className="font-semibold">No matching booking found</div>
                    <div>This session may have occurred without an advance booking (walk-up).</div>
                  </div>
                </div>
              )}
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
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
        {children}
      </div>
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