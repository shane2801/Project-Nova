"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";

type User = { id: number; name: string; email: string; department?: string; role: string; employeeId?: string };

type Booking = {
  id: number;
  stationIdentity: string;
  startAt: string;
  endAt: string;
};

export function TransferModal({
  booking,
  currentUserId,
  onClose,
  onSent,
}: {
  booking: Booking;
  currentUserId: number;
  onClose: () => void;
  onSent: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/dev/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.filter((u: User) => u.id !== currentUserId)))
      .catch(() => setUsers([]));
  }, [currentUserId]);

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.employeeId?.toLowerCase().includes(q) ?? false)
    );
  });

  async function send() {
    if (!recipientId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/bookings/${booking.id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: recipientId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Transfer failed");
      return;
    }
    onSent();
  }

  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Transfer booking
            </div>
            <div className="text-lg font-semibold text-slate-900 mt-0.5">
              {booking.stationIdentity}
            </div>
            <div className="text-sm text-slate-500 font-mono">
              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-100">
          <input
            type="text"
            placeholder="Search by name or email, or employee ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="overflow-y-auto flex-1 min-h-[200px]">
          {filtered.length === 0 ? (
            <div className="p-5 text-sm text-slate-400 text-center">No users match.</div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setRecipientId(u.id)}
                className={`w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-100 last:border-0 ${recipientId === u.id ? "bg-emerald-50" : ""
                  }`}
              >
                <div>
  <div className="font-medium text-slate-900 text-sm flex items-center gap-2">
    {u.name}
    {u.employeeId && (
      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
        {u.employeeId}
      </span>
    )}
  </div>
  <div className="text-xs text-slate-500">{u.email}</div>
</div>
                {recipientId === u.id && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50">
          {error && (
            <div className="mb-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1.5">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={!recipientId || submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send invite
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 text-center">
            The recipient must accept before the booking transfers.
          </div>
        </div>
      </div>
    </div>
  );
}