"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle, RotateCcw, Save, Info } from "lucide-react";

type RuleMeta = {
  key: string;
  label: string;
  unit: string;
  description: string;
  warning?: string;
  min: number;
  max: number;
  step?: number;
  preset?: number[];
};

const RULES: RuleMeta[] = [
  {
    key: "daily_minutes_per_user",
    label: "Daily cap per user",
    unit: "minutes",
    description: "Maximum total charging time a user can book per day. Implements BR002.",
    warning: "Only applies to new bookings. Existing bookings are not retroactively affected.",
    min: 15,
    max: 480,
    step: 15,
    preset: [30, 60, 90, 120],
  },
  {
    key: "slot_duration_minutes",
    label: "Slot duration",
    unit: "minutes",
    description: "Length of each bookable slot in the slot grid.",
    warning: "Changing this affects future slot grids only. Existing 60-min bookings remain unchanged.",
    min: 30,
    max: 60,
    preset: [30, 60],
  },
  {
    key: "booking_window_days",
    label: "Booking window",
    unit: "days ahead",
    description: "How far in advance users can book. 1 = today only.",
    min: 1,
    max: 30,
    preset: [1, 3, 7, 14, 30],
  },
  {
    key: "reminder_lead_minutes",
    label: "Reminder lead time",
    unit: "minutes",
    description: "How early before a booking starts to send a reminder notification.",
    min: 0,
    max: 120,
    step: 5,
    preset: [10, 15, 30, 60],
  },
  {
    key: "transfer_cutoff_minutes",
    label: "Transfer cutoff",
    unit: "minutes before start",
    description: "Transfers must be initiated this many minutes before the booking starts.",
    min: 0,
    max: 1440,
    step: 30,
    preset: [30, 60, 120, 180],
  },
];

type CurrentValues = Record<string, { value: string; updatedAt: string }>;

export function RulesEditor() {
  const [current, setCurrent] = useState<CurrentValues>({});
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rules");
      const data: CurrentValues = await res.json();
      setCurrent(data);
      const initialDraft: Record<string, number> = {};
      for (const rule of RULES) {
        initialDraft[rule.key] = parseInt(data[rule.key]?.value ?? "0", 10);
      }
      setDraft(initialDraft);
    } catch {
      setError("Could not load rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function set(key: string, value: number) {
    setDraft({ ...draft, [key]: value });
    setSavedAt(null);
    setError(null);
  }

  function isDirty(rule: RuleMeta): boolean {
    const cur = parseInt(current[rule.key]?.value ?? "0", 10);
    return cur !== draft[rule.key];
  }

  const anyDirty = RULES.some(isDirty);

  function reset() {
    const initialDraft: Record<string, number> = {};
    for (const rule of RULES) {
      initialDraft[rule.key] = parseInt(current[rule.key]?.value ?? "0", 10);
    }
    setDraft(initialDraft);
    setError(null);
    setSavedAt(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Only send changed rules
      const changed: Record<string, number> = {};
      for (const rule of RULES) {
        if (isDirty(rule)) changed[rule.key] = draft[rule.key];
      }
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      await load();
      setSavedAt(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Booking rules
          </div>
          <div className="text-sm text-slate-700 mt-1">
            Settings that govern how users book and use chargers
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {RULES.map((rule) => {
            const dirty = isDirty(rule);
            const cur = parseInt(current[rule.key]?.value ?? "0", 10);
            const updatedAt = current[rule.key]?.updatedAt;
            return (
              <div key={rule.key} className="p-5 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{rule.label}</div>
                    {dirty && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Changed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{rule.description}</div>
                  {rule.warning && (
                    <div className="flex items-start gap-1.5 mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {rule.warning}
                    </div>
                  )}
                  {updatedAt && (
                    <div className="text-[10px] text-slate-400 mt-2">
                      Last updated {new Date(updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={draft[rule.key] ?? ""}
                      onChange={(e) => set(rule.key, parseInt(e.target.value || "0", 10))}
                      min={rule.min}
                      max={rule.max}
                      step={rule.step ?? 1}
                      className={`w-24 px-3 py-2 border rounded-lg text-sm font-mono tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        dirty ? "border-amber-400 bg-amber-50" : "border-slate-300"
                      }`}
                    />
                    <div className="text-xs text-slate-500">{rule.unit}</div>
                  </div>
                  {rule.preset && (
                    <div className="flex flex-wrap gap-1">
                      {rule.preset.map((p) => (
                        <button
                          key={p}
                          onClick={() => set(rule.key, p)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            draft[rule.key] === p
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    Allowed: {rule.min}–{rule.max}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          {error && (
            <div className="flex-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {!error && savedAt && (
            <div className="flex-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Saved at {savedAt.toLocaleTimeString()}
            </div>
          )}
          {!error && !savedAt && (
            <div className="flex-1 text-xs text-slate-500">
              {anyDirty ? "Unsaved changes" : "All rules saved"}
            </div>
          )}
          <button
            onClick={reset}
            disabled={!anyDirty || saving}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Cancel changes
          </button>
          <button
            onClick={save}
            disabled={!anyDirty || saving}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}