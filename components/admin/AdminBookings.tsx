"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Calendar, X, AlertCircle, Ban, StopCircle, Activity, Zap } from "lucide-react";

type Booking = {
  id: number;
  userId: number;
  stationIdentity: string;
  connectorId: number;
  startAt: string;
  endAt: string;
  status: string;
  carPlate: string | null;
  carModel: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    employeeId: string | null;
    department: string | null;
    carMake: string | null;
    carModel: string | null;
    carPlate: string | null;
    rfidTag: string;
  };
};

type ActiveSession = {
  csmsSessionId: number;
  userId: number | null;
  userName: string;
  department: string | null;
  carMake: string | null;
  carModel: string | null;
  stationIdentity: string;
  connectorId: number;
  startTime: string;
  energyWh: number;
  durationSec: number;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  reserved: { label: "Reserved", color: "bg-blue-50 text-blue-700 border-blue-200" },
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
  released: { label: "Released", color: "bg-amber-50 text-amber-700 border-amber-200" },
  transferred: { label: "Transferred", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [confirmCancel, setConfirmCancel] = useState<Booking | null>(null);
  const [confirmStop, setConfirmStop] = useState<ActiveSession | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce free-text search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filterQuery), 250);
    return () => clearTimeout(t);
  }, [filterQuery]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const bUrl = new URL("/api/admin/bookings", window.location.origin);
      if (filterDate) bUrl.searchParams.set("date", filterDate);
      if (filterStatus) bUrl.searchParams.set("status", filterStatus);
      if (debouncedQuery) bUrl.searchParams.set("q", debouncedQuery);
      bUrl.searchParams.set("limit", "200");

      const sUrl = new URL("/api/admin/active-sessions", window.location.origin);

const [bRes, sRes] = await Promise.all([fetch(bUrl.toString()), fetch(sUrl.toString())]);
const bData = await bRes.json();
const sData = await sRes.json();
setBookings(bData.bookings ?? []);
setActiveSessions(sData.sessions ?? []);
    } catch (e: any) {
      setError(e.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // poll active sessions every 10s for live status
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, [filterDate, filterStatus, debouncedQuery]);

  async function doCancel(booking: Booking) {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Cancel failed");
      }
      setConfirmCancel(null);
      await load();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

 async function doForceStop(session: ActiveSession) {
  setActionLoading(true);
  setActionError(null);
  try {
    const res = await fetch(`/api/admin/active-sessions/${session.csmsSessionId}/force-stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationIdentity: session.stationIdentity }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Force-stop failed");
    }
    setConfirmStop(null);
    // CSMS takes a beat to emit StopTransaction; reload after delay
    setTimeout(load, 1500);
  } catch (e: any) {
    setActionError(e.message);
  } finally {
    setActionLoading(false);
  }
}

  return (
    <div className="space-y-5">
      {/* Active sessions panel */}
      {activeSessions.length > 0 && (
        <div className="bg-white border border-emerald-300 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <div className="text-[11px] font-semibold text-emerald-900 uppercase tracking-widest">
              {activeSessions.length} session{activeSessions.length !== 1 ? "s" : ""} in progress
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 font-semibold">User</th>
                <th className="px-4 py-2 font-semibold">Vehicle</th>
                <th className="px-4 py-2 font-semibold">Station</th>
                <th className="px-4 py-2 font-semibold">Started</th>
                <th className="px-4 py-2 font-semibold text-right">Energy so far</th>
                <th className="px-4 py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => {
                const elapsed = Math.round((Date.now() - new Date(s.startTime).getTime()) / 60000);
                return (
                 <tr key={s.csmsSessionId} className="border-b border-slate-100 last:border-0">
                   <td className="px-4 py-2.5 font-medium text-slate-900">{s.userName}</td>
<td className="px-4 py-2.5 text-slate-700">
  {s.carMake ? `${s.carMake} ${s.carModel ?? ""}` : "—"}
</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">
                      {s.stationIdentity} / {s.connectorId}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      <span className="text-slate-400 text-xs"> · {elapsed}m ago</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Zap className="w-3 h-3" />
                        {(s.energyWh / 1000).toFixed(2)} kWh
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setConfirmStop(s)}
                        className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-medium"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        Force stop
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by user name…"
              className="pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-56"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs border-0 focus:outline-none"
            />
            {filterDate && (
              <button onClick={() => setFilterDate("")} className="text-slate-500 hover:text-slate-900">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg text-xs px-3 py-1.5"
          >
            <option value="">All statuses</option>
            <option value="reserved">Reserved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="released">Released</option>
            <option value="transferred">Transferred</option>
          </select>
          {(filterQuery || filterDate || filterStatus) && (
            <button
              onClick={() => { setFilterQuery(""); setFilterDate(""); setFilterStatus(""); }}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Clear filters
            </button>
          )}
          <div className="ml-auto text-xs text-slate-500">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Bookings table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {bookings.length === 0 && !loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No bookings match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2 font-semibold">User</th>
                  <th className="px-4 py-2 font-semibold">Vehicle</th>
                  <th className="px-4 py-2 font-semibold">Station</th>
                  <th className="px-4 py-2 font-semibold">When</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const start = new Date(b.startAt);
                  const end = new Date(b.endAt);
                  const isPast = end < new Date();
                  const canCancel = (b.status === "reserved" || b.status === "active") && !isPast;
                  const statusInfo = STATUS_LABEL[b.status] ?? { label: b.status, color: "bg-slate-100 text-slate-700 border-slate-200" };
                  return (
                    <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{b.user.name}</div>
                        {b.user.department && (
                          <div className="text-[11px] text-slate-500">{b.user.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {b.user.carMake ? (
                          <>
                            {b.user.carMake} {b.user.carModel}
                            {b.user.carPlate && (
                              <div className="font-mono text-[11px] text-slate-500">{b.user.carPlate}</div>
                            )}
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-mono text-xs text-slate-700">{b.stationIdentity}</div>
                        <div className="text-[11px] text-slate-500">Conn {b.connectorId}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        <div>{start.toLocaleDateString()}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          –{end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {canCancel ? (
                          <button
                            onClick={() => setConfirmCancel(b)}
                            className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-medium"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {confirmCancel && (
        <ConfirmModal
          title="Cancel this booking?"
          message={
            <>
              You're about to cancel <span className="font-semibold">{confirmCancel.user.name}</span>'s booking at{" "}
              <span className="font-mono text-xs">{confirmCancel.stationIdentity}</span> on{" "}
              {new Date(confirmCancel.startAt).toLocaleString()}.
              <br />
              <span className="text-slate-500 text-xs">The user's CSMS auth tag will be revoked. They can rebook if they want.</span>
            </>
          }
          confirmLabel="Cancel booking"
          danger
          loading={actionLoading}
          error={actionError}
          onConfirm={() => doCancel(confirmCancel)}
          onClose={() => { setConfirmCancel(null); setActionError(null); }}
        />
      )}

      {/* Force-stop confirmation */}
      {confirmStop && (
        <ConfirmModal
          title="Force-stop this charging session?"
          message={
            <>
              You're about to remotely stop <span className="font-semibold">{confirmStop.userName}</span>'s
              active session at <span className="font-mono text-xs">{confirmStop.stationIdentity}</span>.
              <br />
              <span className="text-slate-500 text-xs">The CSMS will tell the charger to stop. This action is logged.</span>
            </>
          }
          confirmLabel="Stop session now"
          danger
          loading={actionLoading}
          error={actionError}
          onConfirm={() => doForceStop(confirmStop)}
          onClose={() => { setConfirmStop(null); setActionError(null); }}
        />
      )}
    </div>
  );
}

function ConfirmModal({
  title, message, confirmLabel, danger, loading, error, onConfirm, onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="text-sm text-slate-700 leading-relaxed">{message}</div>
          {error && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-emerald-500"
            } disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}