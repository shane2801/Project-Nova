"use client";

import { useEffect, useState } from "react";

type Connector = {
  connectorId: number;
  status: string;
  errorCode: string;
  updatedAt: string;
};

type Station = {
  identity: string;
  location: string | null;
  vendor: string;
  model: string;
  connected: boolean;
  connectors: Connector[];
};

type Payload = {
  stations: Station[];
  fetchedAt: string;
};

export function NetworkStatus() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/csms/network-status");
        if (!res.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="text-[11px] font-semibold text-red-700 uppercase tracking-widest mb-2">
          Network status
        </div>
        <div className="text-red-900 font-medium">CSMS unreachable</div>
        <div className="text-sm text-red-700 mt-1">Start it with cd csms && npm run dev</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
        <div className="h-3 bg-slate-200 rounded w-32 mb-3"></div>
        <div className="h-12 bg-slate-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const stations = data.stations;
  const totalConnectors = stations.reduce((acc, s) => acc + s.connectors.length, 0);
  const availableConnectors = stations.reduce(
    (acc, s) => acc + s.connectors.filter((c) => c.status === "Available").length,
    0
  );
  const fetchedAt = new Date(data.fetchedAt);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          Network status
          <span className="text-primary normal-case tracking-normal flex items-center gap-1">
            ·
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
            </span>
            live
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Updated {fetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <div className={`text-4xl font-bold tracking-tight leading-none ${availableConnectors > 0 ? "text-emerald-600" : "text-slate-400"}`}>
          {availableConnectors}
        </div>
        <div className="text-slate-500 text-sm">
          of {totalConnectors} connectors available across {stations.length} {stations.length === 1 ? "charger" : "chargers"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stations.map((s) => (
          <StationCard key={s.identity} station={s} />
        ))}
      </div>
    </div>
  );
}

function StationCard({ station }: { station: Station }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="font-semibold text-sm text-slate-900 truncate">
          {station.location ?? "Unassigned location"}
        </div>
        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
          {station.identity}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {station.connectors.length === 0 ? (
          <div className="px-3 py-3 text-xs text-slate-400 italic">No connectors reported</div>
        ) : (
          station.connectors.map((c) => <ConnectorRow key={c.connectorId} connector={c} />)
        )}
      </div>
    </div>
  );
}

function ConnectorRow({ connector }: { connector: Connector }) {
  const config = chipConfig(connector.status);
  return (
    <div className={`px-3 py-2 flex items-center justify-between ${config.bg}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}></span>
        <span className="text-xs text-slate-600">Connector {connector.connectorId}</span>
      </div>
      <span className={`text-[11px] font-semibold ${config.text}`}>
        {connector.status}
      </span>
    </div>
  );
}

function chipConfig(status: string) {
  switch (status) {
    case "Available":
      return { bg: "bg-emerald-50/50", dot: "bg-emerald-500", text: "text-emerald-700" };
    case "Charging":
      return { bg: "bg-blue-50/50", dot: "bg-blue-500 animate-pulse", text: "text-blue-700" };
    case "Preparing":
    case "Finishing":
      return { bg: "bg-amber-50/50", dot: "bg-amber-500", text: "text-amber-700" };
    case "SuspendedEVSE":
    case "SuspendedEV":
      return { bg: "bg-amber-50/50", dot: "bg-amber-500", text: "text-amber-700" };
    case "Reserved":
      return { bg: "bg-purple-50/50", dot: "bg-purple-500", text: "text-purple-700" };
    case "Faulted":
      return { bg: "bg-red-50/50", dot: "bg-red-500", text: "text-red-700" };
    case "Unavailable":
      return { bg: "bg-slate-100/60", dot: "bg-slate-400", text: "text-slate-600" };
    default:
      return { bg: "", dot: "bg-slate-400", text: "text-slate-500" };
  }
}