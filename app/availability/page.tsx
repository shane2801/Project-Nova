import { getCurrentUser } from "@/lib/session";
import { csmsStations, csmsConnectors } from "@/lib/csms";
import { db } from "@/lib/db";
import { SlotPicker } from "@/components/SlotPicker";
import { MapPin, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="py-24 text-center text-slate-500">Pick a user from the top right.</div>
    );
  }

  let stations;
  try {
    stations = await csmsStations();
  } catch {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <div className="font-semibold text-red-900">CSMS unreachable</div>
          <div className="text-sm text-red-700 mt-1">
            Start it with <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">cd csms && npm run dev</code>
          </div>
        </div>
      </div>
    );
  }

  const stationDetails = await Promise.all(
    stations.map(async (s) => {
      const connectors = await csmsConnectors(s.identity).catch(() => []);
      return { ...s, connectors };
    })
  );

  // Today's bookings, all stations
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const todaysBookings = await db.booking.findMany({
    where: {
      startAt: { gte: startOfDay, lt: endOfDay },
      status: { in: ["reserved", "active"] },
    },
    include: { user: true },
    orderBy: { startAt: "asc" },
  });

  // Group by station for fast lookup in each card
  const bookingsByStation: Record<string, typeof todaysBookings> = {};
  for (const b of todaysBookings) {
    if (!bookingsByStation[b.stationIdentity]) bookingsByStation[b.stationIdentity] = [];
    bookingsByStation[b.stationIdentity].push(b);
  }

  const availableConnectorCount = stationDetails.reduce(
    (acc, s) => acc + s.connectors.filter((c) => c.status === "Available").length,
    0
  );
  const totalConnectorCount = stationDetails.reduce((acc, s) => acc + s.connectors.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Today · {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Book a charger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pick an hourly slot between 8am and 10pm. Same-day bookings only.
          </p>
        </div>
        <div className={`rounded-lg px-3.5 py-2 ${availableConnectorCount > 0 ? "bg-emerald-50 border border-primary" : "bg-white border border-slate-200"}`}>
          <div className={`text-[10px] font-semibold uppercase tracking-widest ${availableConnectorCount > 0 ? "text-emerald-700" : "text-slate-500"}`}>
            Available
          </div>
          <div className={`text-lg font-semibold ${availableConnectorCount > 0 ? "text-emerald-700" : "text-slate-900"}`}>
            {availableConnectorCount}/{totalConnectorCount} connectors
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {stationDetails.map((s) => {
          const connector = s.connectors[0];
          const status = connector?.status ?? "Unknown";
          const isInUse = ["Charging", "Preparing", "Finishing", "SuspendedEVSE", "SuspendedEV"].includes(status);
          const isFaulted = ["Faulted", "Unavailable"].includes(status);
          const stationBookings = (bookingsByStation[s.identity] ?? []).map((b) => ({
            startAt: b.startAt.toISOString(),
            endAt: b.endAt.toISOString(),
            status: b.status,
            connectorId: b.connectorId,
            user: { name: b.user.name },
          }));

          return (
            <div key={s.identity} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{s.identity}</div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {s.location ?? "Location not set"}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider mt-1.5">
                      {s.vendor} · {s.model} · {s.connectors.length} {s.connectors.length === 1 ? "connector" : "connectors"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <SlotPicker
                  stationIdentity={s.identity}
                  bookings={stationBookings}
                  connectors={s.connectors.map((c) => ({
                    connectorId: c.connector_id,
                    status: c.status,
                  }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}


function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300"></span>
        Available
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
        Booked
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></span>
        Charging now
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-slate-50 border border-slate-200"></span>
        Past
      </div>
    </div>
  );
}