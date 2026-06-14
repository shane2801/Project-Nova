"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";

const STORAGE_KEY = "evolve_fake_now";

export function getFakeNow(): Date {
  if (typeof window === "undefined") return new Date();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return new Date();
  const d = new Date(stored);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export function TimeMachine() {
  const [open, setOpen] = useState(false);
  const [fakeNow, setFakeNow] = useState<string | null>(null);

  useEffect(() => {
    setFakeNow(localStorage.getItem(STORAGE_KEY));
  }, []);

  function setTime(value: string | null) {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
    setFakeNow(value);
    window.location.reload();
  }

  function applyHour(hour: number) {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    setTime(d.toISOString());
  }

  const realNow = new Date();
  const display = fakeNow ? new Date(fakeNow) : realNow;
  const isOverridden = fakeNow !== null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div className="text-sm font-semibold">Time machine</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Current "now"</div>
          <div className="font-mono text-sm text-white mb-3">
            {display.toLocaleString()}
            {isOverridden && <span className="text-amber-400 ml-2">(fake)</span>}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Jump to hour today</div>
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
              <button
                key={h}
                onClick={() => applyHour(h)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs py-1.5 rounded"
              >
                {h}:00
              </button>
            ))}
          </div>
          <button
            onClick={() => setTime(null)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs py-1.5 rounded"
          >
            Reset to real time
          </button>
          <div className="text-[10px] text-slate-500 mt-2">
            Dev only. Affects UI display. Bookings still use real time.
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-colors ${
            isOverridden ? "bg-amber-500 text-slate-900" : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-xs font-mono">
            {display.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {isOverridden && " ★"}
          </span>
        </button>
      )}
    </div>
  );
}