"use client";

import { useEffect, useState } from "react";
import { MapPin, ArrowRightLeft, Check, X, Clock, AlertCircle } from "lucide-react";

type Pending = {
  id: number;
  bookingId: number;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  fromUser?: { id: number; name: string; email: string; employeeId?: string };
  toUser?: { id: number; name: string; email: string; employeeId?: string };
  booking: {
    id: number;
    stationIdentity: string;
    startAt: string;
    endAt: string;
    location: string | null;
  };
};

export function PendingTransfers() {
  const [incoming, setIncoming] = useState<Pending[]>([]);
  const [outgoing, setOutgoing] = useState<Pending[]>([]);
  const [resolved, setResolved] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/transfers/pending");
    if (!res.ok) return;
    const data = await res.json();
    setIncoming(data.incoming);
    setOutgoing(data.outgoing);
    setResolved(data.recentResolved ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function act(transferId: number, action: "accept" | "decline" | "cancel" | "dismiss") {
    setBusyId(transferId);
    const res = await fetch(`/api/transfers/${transferId}/${action}`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? `${action} failed`);
      return;
    }
    await load();
    if (action === "accept") {
      window.location.reload();
    }
  }

  if (loading) return null;
  if (incoming.length === 0 && outgoing.length === 0 && resolved.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Incoming — needs response */}
      {incoming.map((t) => (
        <div key={t.id} className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-widest">
                Incoming transfer · needs your response
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {t.fromUser?.name} wants to transfer a booking to you
              </div>
              <BookingDetails booking={t.booking} />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => act(t.id, "accept")}
                  disabled={busyId === t.id}
                  className="bg-primary hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={() => act(t.id, "decline")}
                  disabled={busyId === t.id}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Outgoing — waiting on recipient */}
      {outgoing.map((t) => (
        <div key={t.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-widest">
                Outgoing transfer · pending
              </div>
              <div className="text-sm text-slate-800 mt-0.5">
                Waiting for <span className="font-semibold">{t.toUser?.name}</span> to accept
              </div>
              <BookingDetails booking={t.booking} muted />
              <button
                onClick={() => act(t.id, "cancel")}
                disabled={busyId === t.id}
                className="mt-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Cancel invite
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Recently declined/expired by recipient — sender sees this */}
      {resolved.map((t) => (
        <div key={t.id} className="bg-slate-50 border border-slate-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
                Transfer {t.status}
              </div>
              <div className="text-sm text-slate-800 mt-0.5">
                {t.status === "declined" ? (
                  <>
                    <span className="font-semibold">{t.toUser?.name}</span> declined your transfer
                  </>
                ) : (
                  <>Transfer expired — booking has started</>
                )}
              </div>
              <BookingDetails booking={t.booking} muted />
              <div className="text-xs text-slate-500 mt-2">
                You still own this booking. You can try again with a different person while there's time.
              </div>
              <button
                onClick={() => act(t.id, "dismiss")}
                disabled={busyId === t.id}
                className="mt-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingDetails({ booking, muted }: { booking: Pending["booking"]; muted?: boolean }) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const txt = muted ? "text-slate-500" : "text-slate-700";
  return (
    <div className={`text-xs mt-1 space-y-0.5 ${txt}`}>
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3 h-3" />
        <span className="font-medium">{booking.location ?? booking.stationIdentity}</span>
        <span className="font-mono text-slate-400">· {booking.stationIdentity}</span>
      </div>
      <div className="font-mono">
        {start.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
        {" – "}
        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}