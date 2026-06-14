"use client";
import { Fragment } from "react";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PeakHoursHeatmap({ heatmap }: { heatmap: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(heatmap));

  function intensity(dow: number, hour: number): number {
    const v = heatmap[`${dow}-${hour}`] ?? 0;
    return v / max;
  }
  function color(t: number): string {
    if (t === 0) return "#f8fafc";
    // Interpolate slate-100 → emerald-500
    const r = Math.round(241 * (1 - t) + 16 * t);
    const g = Math.round(245 * (1 - t) + 185 * t);
    const b = Math.round(249 * (1 - t) + 129 * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="grid grid-cols-[40px_repeat(24,_18px)] gap-0.5">
          <div></div>
          {HOURS.map((h) => (
            <div key={h} className="text-[9px] text-slate-500 text-center font-mono">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {
            DAYS.map((day, idx) => {
              const dow = idx + 1; // shift so Monday=1, Tuesday=2, etc.
              return (
                <Fragment key={`row-${dow}`}>
                  <div className="text-[10px] text-slate-600 self-center pr-2 text-right">
                    {day}
                  </div>
                  {HOURS.map((hour) => {
                    const v = heatmap[`${dow}-${hour}`] ?? 0;
                    const t = intensity(dow, hour);
                    return (
                      <div
                        key={`${dow}-${hour}`}
                        title={`${day} ${hour}:00 — ${v} sessions`}
                        className="w-[18px] h-[18px] rounded-sm"
                        style={{ backgroundColor: color(t) }}
                      />
                    );
                  })}
                </Fragment>)
            })
          }
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color(t) }} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}