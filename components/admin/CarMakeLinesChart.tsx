"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

type Series = { make: string; data: { date: string; energyWh: number }[] };

// A pleasant palette of distinct colors
const COLORS = [
  "#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#8b5cf6", "#84cc16", "#f97316",
  "#14b8a6", "#0ea5e9", "#d946ef", "#eab308",
];

export function CarMakeLinesChart({ series }: { series: Series[] }) {
  if (series.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        No data.
      </div>
    );
  }

  // Build a unified dataset where each row is one date with one column per make
  const allDates = Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.date)))).sort();
  const data = allDates.map((date) => {
    const row: Record<string, any> = { date };
    for (const s of series) {
      const point = s.data.find((p) => p.date === date);
      row[s.make] = point ? point.energyWh / 1000 : 0;
    }
    return row;
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }}
            tick={{ fontSize: 10, fill: "#64748b" }}
          />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const sorted = [...payload]
                .filter((p) => (p.value as number) > 0)
                .sort((a, b) => (b.value as number) - (a.value as number));
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
                  <div className="font-semibold text-slate-900 mb-1.5 pb-1.5 border-b border-slate-100">
                    {new Date(label).toLocaleDateString()}
                  </div>
                  <div className="space-y-0.5">
                    {sorted.slice(0, 8).map((p) => (
                      <div key={p.dataKey as string} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-slate-700">{p.dataKey}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-900">
                          {(p.value as number).toFixed(2)} kWh
                        </span>
                      </div>
                    ))}
                    {sorted.length > 8 && (
                      <div className="text-[10px] text-slate-400 pt-1">+{sorted.length - 8} more</div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
            iconType="circle"
            iconSize={8}
          />
          {series.map((s, i) => (
            <Line
              key={s.make}
              type="monotone"
              dataKey={s.make}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}