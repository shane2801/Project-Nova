"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Zap, ArrowRightLeft, Plug } from "lucide-react";
import { TransferModal } from "./TransferModal";

type Booking = {
  id: number;
  stationIdentity: string;
  connectorId: number;
  startAt: string;
  endAt: string;
  status: string;
  location: string | null;
  simulatedSessionId?: number | null;
};
type LiveSession = {
  id: number;
  transaction_id: number;
  energy_wh: number | null;
  status: "Active" | "Completed";
  start_time: string;
  stop_time: string | null;
};

export function MyBookingsList({
  userRfid,
  userId,
  bookings: initialBookings,
}: {
  userRfid: string;
  userId: number;
  bookings: Booking[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [transferring, setTransferring] = useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function pollSessions() {
      const res = await fetch(`/api/sessions?idTag=${encodeURIComponent(userRfid)}`);
      if (!res.ok) return;
      const data: LiveSession[] = await res.json();
      // For any Active session, fetch detail to get the live energy from meterValues
      const enriched = await Promise.all(
        data.map(async (s) => {
          if (s.status !== "Active") return s;
          try {
            const detailRes = await fetch(`/api/sessions/${s.id}`);
            if (!detailRes.ok) return s;
            const detail = await detailRes.json();
            const meterValues = detail.meterValues ?? [];
            const energyReadings = meterValues.filter(
              (mv: any) => mv.measurand === "Energy.Active.Import.Register"
            );
            if (energyReadings.length === 0) return s;
            const latest = energyReadings[energyReadings.length - 1];
            const liveEnergyWh = latest.value - (detail.meter_start ?? 0);
            return { ...s, energy_wh: liveEnergyWh };
          } catch {
            return s;
          }
        })
      );
      if (!cancelled) setSessions(enriched);
    }
    pollSessions();
    const interval = setInterval(pollSessions, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userRfid]);

  async function release(id: number) {
    if (!confirm("Release this booking? The slot will become available to others.")) return;
    const res = await fetch(`/api/bookings/${id}/release`, { method: "POST" });
    if (res.ok) {
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "released" } : b)));
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Release failed");
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
        <p className="text-slate-500">No bookings yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {bookings.map((b) => {
          const start = new Date(b.startAt);
          const end = new Date(b.endAt);
          const matchingSession =
            // First preference: explicit link via simulator
            (b.simulatedSessionId
              ? sessions.find((s) => s.id === b.simulatedSessionId)
              : null) ??
            // Fallback: session that started within the booking window
            sessions.find((s) => {
              const sStart = new Date(s.start_time);
              return sStart >= start && sStart <= end;
            });
          const isLive = matchingSession?.status === "Active";
          const canManage = b.status === "reserved";
          return (
            <div
              key={b.id}
              className={`bg-white rounded-xl p-5 transition-all ${isLive ? "border-2 border-primary" : "border border-slate-200"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="font-semibold text-slate-900">
                      {b.location ?? "Location unknown"}
                    </div>
                    <BookingStatusBadge status={b.status} live={isLive} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-mono">{b.stationIdentity}</span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Plug className="w-3 h-3" />
                      Connector {b.connectorId}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">
                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => release(b.id)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-3 py-1 text-xs font-medium transition-colors"
                      >
                        Release
                      </button>
                      {(() => {
                        const oneHourBeforeStart = start.getTime() - 60 * 60 * 1000;
                        const tooLate = Date.now() > oneHourBeforeStart;
                        return (
                          <button
                            onClick={() => setTransferring(b)}
                            disabled={tooLate}
                            title={tooLate ? "Too late — transfers must be initiated at least 1 hour before start" : "Transfer to another user"}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-3 py-1 text-xs font-medium transition-colors inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            Transfer
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {matchingSession && (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-widest font-semibold mb-1">
                      {isLive ? (
                        <>
                          <Zap className="w-3 h-3 text-primary" />
                          <span className="text-emerald-700">Live</span>
                        </>
                      ) : (
                        <span className="text-slate-500">Total</span>
                      )}
                    </div>
                    <div className={`font-mono text-3xl font-bold tracking-tight tabular-nums ${isLive ? "text-emerald-600" : "text-slate-900"}`}>
                      {((matchingSession.energy_wh ?? 0) / 1000).toFixed(2)}
                      <span className="text-sm font-normal text-slate-500 ml-1">kWh</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {transferring && (
        <TransferModal
          booking={transferring}
          currentUserId={userId}
          onClose={() => setTransferring(null)}
          onSent={() => {
            setTransferring(null);
            alert("Invite sent. The recipient will see it on their home page.");
          }}
        />
      )}
    </>
  );
}

function BookingStatusBadge({ status, live }: { status: string; live?: boolean }) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        Charging now
      </span>
    );
  }
  const map: Record<string, string> = {
    reserved: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    released: "bg-slate-50 text-slate-500 border-slate-200",
    cancelled: "bg-slate-50 text-slate-500 border-slate-200",
    transferred: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"
        }`}
    >
      {status}
    </span>
  );
}