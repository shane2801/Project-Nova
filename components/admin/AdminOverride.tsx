"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Calendar, AlertCircle, Wrench, Trash2, User, CheckCircle2, X } from "lucide-react";
import { UserSearchSelect } from "./UserSearchSelect";
type UserOption = {
  id: number;
  name: string;
  email: string;
  employeeId: string | null;
  department: string | null;
  rfidTag: string;
};

type Station = {
  identity: string;
  location: string | null;
  connectors: { connectorId: number; status: string }[];
};

type Block = {
  id: number;
  stationIdentity: string;
  connectorId: number;
  startAt: string;
  endAt: string;
  reason: string;
  csmsBlocked: boolean;
  active: boolean;
  createdBy: { name: string };
};

export function AdminOverride() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"booking" | "maintenance">("booking");

  async function load() {
    setLoading(true);
    try {
      const [uRes, sRes, bRes] = await Promise.all([
        fetch("/api/dev/users"),
        fetch("/api/csms/network-status"),
        fetch("/api/admin/maintenance"),
      ]);
      const uData = await uRes.json();
      const sData = await sRes.json();
      const bData = await bRes.json();
      setUsers(uData.filter((u: UserOption) => true));
      setStations((sData.stations ?? []).map((s: any) => ({
        identity: s.identity,
        location: s.location,
        connectors: s.connectors ?? [],
      })));
      setBlocks(bData.blocks ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("booking")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
            tab === "booking"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Create booking on behalf
        </button>
        <button
          onClick={() => setTab("maintenance")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 ${
            tab === "maintenance"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Maintenance blocks
          {blocks.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              {blocks.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : tab === "booking" ? (
        <CreateBookingForm users={users} stations={stations} onCreated={load} />
      ) : (
        <MaintenancePanel stations={stations} blocks={blocks} onChange={load} />
      )}
    </div>
  );
}

function CreateBookingForm({
  users, stations, onCreated,
}: {
  users: UserOption[];
  stations: Station[];
  onCreated: () => void;
}) {
  const [userId, setUserId] = useState<number | null>(null);
  const [stationIdentity, setStationIdentity] = useState<string>("");
  const [connectorId, setConnectorId] = useState<number>(1);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hour, setHour] = useState<number>(new Date().getHours());
  const [bypassQuota, setBypassQuota] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const station = stations.find((s) => s.identity === stationIdentity);

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!userId || !stationIdentity || !date) {
      setError("Pick a user, station, and date");
      return;
    }
    const startAt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
    setSubmitting(true);
    const res = await fetch("/api/admin/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        stationIdentity,
        connectorId,
        startAt: startAt.toISOString(),
        bypassQuota,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setSuccess(`Booking created for ${data.createdFor}${data.bypassedQuota ? " (quota bypassed)" : ""}`);
    onCreated();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="md:col-span-2">
  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
    Book on behalf of
  </label>
  <UserSearchSelect
    users={users.map((u) => ({
      id: u.id,
      name: u.name,
      employeeId: u.employeeId,
    }))}
    value={userId}
    onChange={setUserId}
  />
</div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Station
          </label>
          <select
            value={stationIdentity}
            onChange={(e) => {
              setStationIdentity(e.target.value);
              setConnectorId(1);
            }}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Select a station</option>
            {stations.map((s) => (
              <option key={s.identity} value={s.identity}>
                {s.identity}{s.location ? ` — ${s.location}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Connector
          </label>
          <select
            value={connectorId}
            onChange={(e) => setConnectorId(parseInt(e.target.value, 10))}
            disabled={!station}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
          >
            {station?.connectors.map((c) => (
              <option key={c.connectorId} value={c.connectorId}>
                Connector {c.connectorId} ({c.status})
              </option>
            )) ?? <option>—</option>}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Hour
          </label>
          <select
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10))}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00 – {String(h + 1).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="bypass"
          checked={bypassQuota}
          onChange={(e) => setBypassQuota(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <label htmlFor="bypass" className="text-sm text-slate-700">
          Bypass user's daily quota
        </label>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-2 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || !userId || !stationIdentity}
        className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        <Plus className="w-4 h-4" />
        Create booking
      </button>
    </div>
  );
}

function MaintenancePanel({
  stations, blocks, onChange,
}: {
  stations: Station[];
  blocks: Block[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  async function lift(id: number) {
    if (!confirm("Lift this maintenance block?")) return;
    const res = await fetch(`/api/admin/maintenance/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {blocks.length === 0
            ? "No active maintenance blocks."
            : `${blocks.length} active block${blocks.length === 1 ? "" : "s"}`}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-1.5 rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          New block
        </button>
      </div>

      {showForm && (
        <NewBlockForm
          stations={stations}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); onChange(); }}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {blocks.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No maintenance blocks. Use "New block" to schedule one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 font-semibold">Connector</th>
                <th className="px-4 py-2 font-semibold">Window</th>
                <th className="px-4 py-2 font-semibold">Reason</th>
                <th className="px-4 py-2 font-semibold">CSMS</th>
                <th className="px-4 py-2 font-semibold">By</th>
                <th className="px-4 py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {b.stationIdentity} / {b.connectorId}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    <div className="font-mono text-xs">
                      {new Date(b.startAt).toLocaleString([], {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                      {" → "}
                      {new Date(b.endAt).toLocaleString([], {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{b.reason}</td>
                  <td className="px-4 py-2.5">
                    {b.csmsBlocked ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                        DB only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{b.createdBy.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => lift(b.id)}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-xs font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      Lift
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NewBlockForm({
  stations, onClose, onCreated,
}: {
  stations: Station[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [stationIdentity, setStationIdentity] = useState("");
  const [connectorId, setConnectorId] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const station = stations.find((s) => s.identity === stationIdentity);

  async function submit() {
    setError(null);
    if (!stationIdentity) { setError("Pick a station"); return; }
    if (!reason.trim()) { setError("Reason required"); return; }
    if (endHour <= startHour) { setError("End hour must be after start hour"); return; }

    const startAt = new Date(`${date}T${String(startHour).padStart(2, "0")}:00:00`);
    const endAt = new Date(`${date}T${String(endHour).padStart(2, "0")}:00:00`);

    setSubmitting(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationIdentity,
        connectorId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        reason: reason.trim(),
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    onCreated();
  }

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-semibold text-amber-900">Schedule maintenance block</div>
        <button onClick={onClose} className="text-amber-700 hover:text-amber-900">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Station</label>
          <select
            value={stationIdentity}
            onChange={(e) => { setStationIdentity(e.target.value); setConnectorId(1); }}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Select…</option>
            {stations.map((s) => (
              <option key={s.identity} value={s.identity}>
                {s.identity}{s.location ? ` — ${s.location}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Connector</label>
          <select
            value={connectorId}
            onChange={(e) => setConnectorId(parseInt(e.target.value, 10))}
            disabled={!station}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-50"
          >
            {station?.connectors.map((c) => (
              <option key={c.connectorId} value={c.connectorId}>Connector {c.connectorId}</option>
            )) ?? <option>—</option>}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">From</label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">To</label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {Array.from({ length: 25 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Quarterly inspection"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        <Wrench className="w-4 h-4" />
        Block connector
      </button>
    </div>
  );
}