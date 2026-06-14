"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { computeSlots, type Slot } from "@/lib/slots";
import { getFakeNow } from "./TimeMachine";
import { Loader2, Plug, ChevronDown } from "lucide-react";

type Booking = {
  startAt: string;
  endAt: string;
  status: string;
  connectorId?: number;
  user?: { name: string };
};

type Connector = {
  connectorId: number;
  status: string;
};

export function SlotPicker({
  stationIdentity,
  bookings,
  connectors,
}: {
  stationIdentity: string;
  bookings: Booking[];
  connectors: Connector[];
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [loadingHour, setLoadingHour] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(
    connectors[0]?.connectorId ?? null
  );
  const router = useRouter();

  useEffect(() => {
    setNow(getFakeNow());
    const interval = setInterval(() => setNow(getFakeNow()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Keep selection valid if the connector list changes
  useEffect(() => {
    if (selectedConnectorId == null && connectors.length > 0) {
      setSelectedConnectorId(connectors[0].connectorId);
    }
  }, [connectors, selectedConnectorId]);

  if (!now) {
    return <div className="h-24 bg-slate-50 rounded animate-pulse"></div>;
  }

  if (connectors.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-500">
        No connectors reported by this station.
      </div>
    );
  }

  const selected = connectors.find((c) => c.connectorId === selectedConnectorId);
  const slots = computeSlots({
    now,
    bookings,
    stationIdentity,
    connectorId: selectedConnectorId ?? undefined,
    connectorStatus: selected?.status,
  });
  const isFaulted = selected ? ["Faulted", "Unavailable"].includes(selected.status) : false;

  async function book(slot: Slot) {
    if (slot.state !== "available" || isFaulted || loadingHour !== null || selectedConnectorId == null) return;
    setLoadingHour(slot.hour);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationIdentity,
        connectorId: selectedConnectorId,
        startAt: slot.startAt.toISOString(),
      }),
    });
    setLoadingHour(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Booking failed");
      return;
    }
    router.push("/my-bookings");
  }

  return (
    <div className="space-y-4">
      {/* Connector selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-medium text-slate-600">View slots for:</label>
          <div className="relative">
            <select
              value={selectedConnectorId ?? ""}
              onChange={(e) => setSelectedConnectorId(parseInt(e.target.value, 10))}
              className="appearance-none bg-white border border-slate-300 rounded-md text-sm font-medium pl-3 pr-8 py-1.5 text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {connectors.map((c) => (
                <option key={c.connectorId} value={c.connectorId}>
                  Connector {c.connectorId}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        {selected && <ConnectorStatusBadge status={selected.status} />}
      </div>

      {/* Slot grid */}
      <div>
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Today's slots · 08:00 – 22:00
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {slots.map((slot) => (
            <SlotChip
              key={slot.hour}
              slot={slot}
              loading={loadingHour === slot.hour}
              onClick={() => book(slot)}
              disabled={isFaulted}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  );
}

function SlotChip({
  slot,
  loading,
  onClick,
  disabled,
}: {
  slot: Slot;
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isAvailable = slot.state === "available" && !disabled;

  const config =
    slot.state === "live"
      ? { bg: "bg-blue-100 border-blue-400", text: "text-blue-800" }
      : slot.state === "booked"
      ? { bg: "bg-slate-200 border-slate-300", text: "text-slate-500" }
      : slot.state === "past"
      ? { bg: "bg-slate-50 border-slate-200", text: "text-slate-300" }
      : disabled
      ? { bg: "bg-slate-50 border-slate-200", text: "text-slate-300" }
      : { bg: "bg-emerald-50 border-emerald-300 hover:bg-emerald-100 cursor-pointer", text: "text-emerald-800" };

  const label = `${slot.hour}:00–${slot.hour + 1}:00`;

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable || loading}
      title={
        slot.state === "booked"
          ? `Booked by ${slot.bookedBy ?? "someone"}`
          : slot.state === "live"
          ? slot.bookedBy
            ? `Charging now — ${slot.bookedBy}`
            : "Charging now — unbooked session"
          : slot.state === "past"
          ? "Past"
          : isAvailable
          ? `Book ${slot.hour}:00 – ${slot.hour + 1}:00`
          : "Unavailable"
      }
      className={`relative h-11 rounded-md border text-[11px] font-semibold transition-colors ${config.bg} ${config.text} ${
        !isAvailable ? "cursor-not-allowed" : ""
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
      ) : (
        <>
          {label}
          {slot.state === "live" && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          )}
        </>
      )}
    </button>
  );
}

function ConnectorStatusBadge({ status }: { status: string }) {
  const config = badgeConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {status}
    </span>
  );
}

function badgeConfig(status: string) {
  switch (status) {
    case "Available":
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-primary", dot: "bg-primary" };
    case "Charging":
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", dot: "bg-blue-500 animate-pulse" };
    case "Preparing":
    case "Finishing":
    case "SuspendedEVSE":
    case "SuspendedEV":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" };
    case "Reserved":
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", dot: "bg-purple-500" };
    case "Faulted":
      return { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", dot: "bg-red-500" };
    case "Unavailable":
      return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" };
    default:
      return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" };
  }
}