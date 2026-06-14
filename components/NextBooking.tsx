"use client";

import { useEffect, useState } from "react";
import { MapPin, Plug, Zap } from "lucide-react";
import { TransferModal } from "./TransferModal";

type Booking = {
  id: number;
  stationIdentity: string;
  connectorId: number;
  startAt: string;
  endAt: string;
  status: string;
  location: string | null;
  simulatedAt: string | null;
};

type LiveSession = {
  id: number;
  status: "Active" | "Completed";
  start_time: string;
  stop_time: string | null;
  energy_wh: number | null;
};

export function NextBooking() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dev/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => u?.id && setCurrentUserId(u.id));
  }, []);

  async function loadBooking() {
    const res = await fetch("/api/bookings/next");
    if (!res.ok) return;
    const data = await res.json();
    setBooking(data);
    setLoaded(true);
  }

  async function loadSession(bookingId: number) {
    const res = await fetch(`/api/bookings/${bookingId}/live-session`);
    if (!res.ok) return;
    const data = await res.json();
    setSession(data);
  }

  useEffect(() => {
    loadBooking();
    const interval = setInterval(loadBooking, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!booking?.simulatedAt) {
      setSession(null);
      return;
    }
    loadSession(booking.id);
    const interval = setInterval(() => loadSession(booking.id), 3000);
    return () => clearInterval(interval);
  }, [booking?.id, booking?.simulatedAt]);

  async function release(id: number) {
    if (!confirm("Release this booking?")) return;
    const res = await fetch(`/api/bookings/${id}/release`, { method: "POST" });
    if (res.ok) setBooking(null);
  }

  if (!loaded) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 animate-pulse h-full">
        <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
        <div className="h-6 bg-slate-200 rounded w-40 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-32"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-5 h-full flex flex-col justify-center">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Your next booking
        </div>
        <div className="text-sm text-slate-500">No upcoming bookings.</div>
      </div>
    );
  }

  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const isLive = session?.status === "Active";
  const isCompleted = session?.status === "Completed";

  // Live charging view (simulator running)
  if (isLive && session) {
    const sessionStart = new Date(session.start_time);
    const elapsedMs = Date.now() - sessionStart.getTime();
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
    const kwh = (session.energy_wh ?? 0) / 1000;
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-400 rounded-xl p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Charging live
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
        </div>

        <div className="text-lg font-semibold text-emerald-950 leading-tight flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
          {booking.location ?? "Location unknown"}
        </div>
        <div className="font-mono text-xs text-emerald-800/80 mt-0.5">
          {booking.stationIdentity} · Connector {booking.connectorId}
        </div>

        <div className="my-3 text-center">
          <div className="font-mono text-4xl font-bold tracking-tight text-emerald-700 tabular-nums">
            {kwh.toFixed(3)}
            <span className="text-base font-normal text-emerald-600 ml-1">kWh</span>
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            Elapsed {elapsedMin}m {elapsedSec}s
          </div>
        </div>

        <div className="text-[10px] text-emerald-700 mt-auto opacity-70">
          Booking window: {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    );
  }

  // Completed simulation view
  if (isCompleted && session) {
    const kwh = (session.energy_wh ?? 0) / 1000;
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 h-full flex flex-col">
        <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-widest mb-2">
          Session completed
        </div>
        <div className="text-lg font-semibold text-blue-950 leading-tight flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
          {booking.location ?? "Location unknown"}
        </div>
        <div className="font-mono text-xs text-blue-800/80 mt-0.5">
          {booking.stationIdentity} · Connector {booking.connectorId}
        </div>
        <div className="my-3 text-center">
          <div className="font-mono text-3xl font-bold tracking-tight text-blue-700">
            {kwh.toFixed(3)}
            <span className="text-sm font-normal text-blue-600 ml-1">kWh consumed</span>
          </div>
        </div>
      </div>
    );
  }

  // Default reserved view
  const now = new Date();
  const minsUntil = Math.round((start.getTime() - now.getTime()) / 60000);
  const startedAgo = minsUntil < 0;
  const countdown = startedAgo
    ? `Started ${Math.abs(minsUntil)} min ago`
    : minsUntil < 60
    ? `In ${minsUntil} min`
    : `In ${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`;

  const oneHourBeforeStart = start.getTime() - 60 * 60 * 1000;
  const tooLate = Date.now() > oneHourBeforeStart;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 h-full flex flex-col">
      <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest mb-2">
        Your next booking
      </div>
      <div className="text-lg font-semibold text-amber-950 leading-tight flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
        {booking.location ?? "Location unknown"}
      </div>
      <div className="font-mono text-xs text-amber-800/80 mt-0.5">{booking.stationIdentity}</div>

      <div className="mt-3 space-y-1 text-sm text-amber-900">
        <div className="flex items-center gap-1.5">
          <Plug className="w-3.5 h-3.5 text-amber-700" />
          <span>Connector {booking.connectorId}</span>
        </div>
        <div className="font-mono text-xs text-amber-800">
          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="text-xs text-amber-700 font-semibold">{countdown}</div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => release(booking.id)}
          className="bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md px-3 py-1 text-xs font-medium transition-colors flex-1"
        >
          Release
        </button>
        <button
          onClick={() => setTransferring(true)}
          disabled={tooLate}
          title={tooLate ? "Too late — transfers must be initiated at least 1 hour before start" : "Transfer to another user"}
          className="bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md px-3 py-1 text-xs font-medium transition-colors flex-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
          Transfer
        </button>
      </div>

      {transferring && booking && currentUserId !== null && (
        <TransferModal
          booking={booking}
          currentUserId={currentUserId}
          onClose={() => setTransferring(false)}
          onSent={() => {
            setTransferring(false);
            alert("Invite sent.");
          }}
        />
      )}
    </div>
  );
}