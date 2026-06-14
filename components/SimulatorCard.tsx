"use client";

import { useEffect, useState } from "react";
import {
  Wifi,
  Play,
  Square,
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";

type Run = {
  id: string;
  startedAt: string;
  identity: string;
  tag: string;
  duration: number;
  power: number;
  interval: number;
  exitedAt: string | null;
  exitCode: number | null;
  running: boolean;
  spawnError: string | null;
  log: string;
};

type NextBooking = {
  id: number;
  stationIdentity: string;
  connectorId: number;
  startAt: string;
  endAt: string;
  location: string | null;
};

export function SimulatorCard({ userRfid }: { userRfid: string }) {
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [recentRun, setRecentRun] = useState<Run | null>(null);
  const [nextBooking, setNextBooking] = useState<NextBooking | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced params (only used if user expands)
  const [duration, setDuration] = useState<number | "">("");
  const [power, setPower] = useState(7400);
  const [interval, setIntervalSec] = useState(10);

  async function loadStatus() {
    try {
      const res = await fetch("/api/simulator/status");
      if (!res.ok) return;
      const data = await res.json();
      const mine =
        data.active.find((r: Run) => r.tag === userRfid) ?? data.active[0] ?? null;
      setActiveRun(mine);
      if (!mine) {
        const recent = (data.recent ?? [])
          .filter((r: Run) => r.tag === userRfid)
          .sort((a: Run, b: Run) => (b.exitedAt ?? "").localeCompare(a.exitedAt ?? ""))[0] ?? null;
        setRecentRun(recent);
      } else {
        setRecentRun(null);
      }
    } catch {
      // ignore
    }
  }

  async function loadNextBooking() {
    try {
      const res = await fetch("/api/bookings/next");
      if (!res.ok) return;
      const data = await res.json();
      setNextBooking(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadStatus();
    loadNextBooking();
    const i = setInterval(() => {
      loadStatus();
      loadNextBooking();
    }, 3000);
    return () => clearInterval(i);
  }, [userRfid]);

  async function start() {
    if (!nextBooking) {
      setError("No upcoming booking. Book a charger first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const overrideDuration = duration === "" ? undefined : Number(duration);
    const res = await fetch(`/api/bookings/${nextBooking.id}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duration: overrideDuration,
        power,
        interval,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to start simulator");
      return;
    }
    setActiveRun(data.run);
  }

  async function stop() {
    if (!activeRun) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/simulator/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeRun.id }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to stop");
      return;
    }
    setActiveRun(null);
  }

  // Running state
  if (activeRun?.running) {
    const elapsed = Math.round((Date.now() - new Date(activeRun.startedAt).getTime()) / 1000);
    const remaining = Math.max(0, activeRun.duration - elapsed);
    const pct = Math.min(100, (elapsed / activeRun.duration) * 100);
    return (
      <div className="bg-white border border-blue-300 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Cpu className="w-3 h-3" />
              Simulator running
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              </span>
            </div>
            <div className="font-mono text-sm text-slate-700">{activeRun.identity}</div>
            <div className="font-mono text-xs text-slate-500 mt-0.5">tag: {activeRun.tag}</div>
          </div>
          <button
            onClick={stop}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
            Stop
          </button>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Elapsed {elapsed}s</span>
            <span>{remaining}s remaining</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Power" value={`${(activeRun.power / 1000).toFixed(1)} kW`} />
          <Metric label="Interval" value={`${activeRun.interval}s`} />
          <Metric label="Duration" value={`${activeRun.duration}s`} />
        </div>

        <Logs log={activeRun.log} />
      </div>
    );
  }

  // Just-exited state
  if (recentRun) {
    const ok = recentRun.exitCode === 0;
    return (
      <div className={`bg-white border rounded-xl p-5 ${ok ? "border-emerald-300" : "border-amber-300"}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className={`text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${ok ? "text-emerald-700" : "text-amber-700"}`}>
              {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              Simulator {ok ? "completed" : "ended unexpectedly"}
            </div>
            <div className="font-mono text-xs text-slate-600">
              {recentRun.identity} · exit code {recentRun.exitCode ?? "n/a"}
            </div>
            {recentRun.spawnError && (
              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                {recentRun.spawnError}
              </div>
            )}
          </div>
          <button
            onClick={() => { setRecentRun(null); loadStatus(); }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Dismiss
          </button>
        </div>
        <Logs log={recentRun.log} defaultOpen={!ok} />
        <button
          onClick={() => setRecentRun(null)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-1.5 rounded-md"
        >
          <Play className="w-4 h-4" />
          New simulation
        </button>
      </div>
    );
  }

  // Idle / form state
  const start_ = nextBooking ? new Date(nextBooking.startAt) : null;
  const end_ = nextBooking ? new Date(nextBooking.endAt) : null;
  const bookingDurationSec = start_ && end_ ? Math.round((end_.getTime() - start_.getTime()) / 1000) : 0;
  const effectiveDuration = duration === "" ? bookingDurationSec : Number(duration);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            Simulate charging
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">DEV</span>
          </div>
          {nextBooking ? (
            <div className="text-sm text-slate-700">
              <span className="text-slate-500">Will simulate your next booking:</span>{" "}
              <span className="font-semibold">{nextBooking.location ?? nextBooking.stationIdentity}</span>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {nextBooking.stationIdentity} · Connector {nextBooking.connectorId}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No upcoming booking. Book a charger first.</div>
          )}
        </div>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <button
          onClick={start}
          disabled={submitting || !nextBooking}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Start simulation
            </>
          )}
        </button>
      </div>

      {nextBooking && (
        <div className="text-[11px] text-slate-500 mb-2">
          Default duration: {bookingDurationSec}s (matches booking length)
        </div>
      )}

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Advanced parameters
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <FormField label="Duration (s)">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder={String(bookingDurationSec)}
              className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
              min={10}
              max={3600}
            />
          </FormField>
          <FormField label="Power (W)">
            <input
              type="number"
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
              min={0}
              max={22000}
            />
          </FormField>
          <FormField label="Interval (s)">
            <input
              type="number"
              value={interval}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
              min={1}
              max={60}
            />
          </FormField>
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="font-mono text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Logs({ log, defaultOpen }: { log: string; defaultOpen?: boolean }) {
  if (!log) return null;
  return (
    <details className="mt-3" {...(defaultOpen ? { open: true } : {})}>
      <summary className="text-[10px] text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-700">
        Logs
      </summary>
      <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 mt-1 max-h-40 overflow-auto whitespace-pre-wrap">
        {log}
      </pre>
    </details>
  );
}