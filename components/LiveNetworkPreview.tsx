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
        // CSMS unreachable — keep silent on auth screen
      }
    }
    load();
    const i = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  if (!stations) {
    return <div className="text-xs text-slate-400">Connecting to network…</div>;
  }

  const totalConnectors = stations.reduce((acc, s) => acc + s.connectors.length, 0);
  const availableConnectors = stations.reduce(
    (acc, s) => acc + s.connectors.filter((c) => c.status === "Available").length,
    0
  );

  if (totalConnectors === 0) {
    return (
      <div className="text-xs text-slate-400">
        No chargers reporting. Boot the simulator at least once.
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-slate-200 leading-snug">
        <span className="font-semibold text-white">{availableConnectors}</span> of{" "}
        <span className="font-semibold text-white">{totalConnectors}</span> connectors
        available now across the network.
      </div>
      <div className="mt-3 space-y-1.5">
        {stations.slice(0, 3).map((s) => (
          <div key={s.identity} className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 truncate">{s.location ?? s.identity}</span>
            <div className="flex gap-1 shrink-0">
              {s.connectors.map((c) => (
                <span
                  key={c.connectorId}
                  className={`w-1.5 h-1.5 rounded-full ${
                    c.status === "Available"
                      ? "bg-primary"
                      : c.status === "Charging"
                      ? "bg-blue-400"
                      : "bg-slate-600"
                  }`}
                  title={`Connector ${c.connectorId}: ${c.status}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}