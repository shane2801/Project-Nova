"use client";

import { useEffect, useState } from "react";

type Station = {
  identity: string;
  location: string | null;
  connectors: { connectorId: number; status: string }[];
};

export function LiveNetworkPreview() {
  const [stations, setStations] = useState<Station[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/csms/network-status");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStations(data.stations ?? []);
      } catch {
        // Silent — CSMS may be down, that's fine on the login screen
      }
    }
    load();
    const i = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  if (!stations) {
    return null; // hide if no data yet — keeps the page clean
  }

  const totalConnectors = stations.reduce((acc, s) => acc + s.connectors.length, 0);
  const availableConnectors = stations.reduce(
    (acc, s) => acc + s.connectors.filter((c) => c.status === "Available").length,
    0
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Network · live
          </span>
        </div>
        <span className="text-[10px] text-slate-500">Updated just now</span>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-white tabular-nums">{availableConnectors}</span>
        <span className="text-sm text-slate-400">
          of {totalConnectors} connectors available
        </span>
      </div>
      <div className="space-y-1.5">
        {stations.slice(0, 4).map((s) => (
          <div
            key={s.identity}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-slate-500 truncate">{s.identity}</span>
              <span className="text-slate-300 truncate">{s.location ?? ""}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              {s.connectors.map((c) => (
                <span
                  key={c.connectorId}
                  className={`w-1.5 h-1.5 rounded-full ${
                    c.status === "Available"
                      ? "bg-emerald-400"
                      : c.status === "Charging"
                      ? "bg-blue-400"
                      : "bg-slate-600"
                  }`}
                  title={`Connector ${c.connectorId}: ${c.status}`}
                ></span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}