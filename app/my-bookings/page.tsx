import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { MyBookingsList } from "@/components/MyBookingsList";
import { csmsStations } from "@/lib/csms";
import { Button } from "@/components/ui/button"; // optional, depending on your setup
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="py-24 text-center text-slate-500">Pick a user from the top right.</div>;
  }

  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    orderBy: { startAt: "desc" },
    take: 20,
  });

  // Enrich with station location
  const locations = new Map<string, string | null>();
  try {
    const stations = await csmsStations();
    for (const s of stations) locations.set(s.identity, s.location);
  } catch {
    // CSMS may be down; skip
  }
  const enriched = bookings.map((b) => ({
    ...b,
    location: locations.get(b.stationIdentity) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Your activity
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My bookings</h1>
          <p className="text-sm text-slate-500 mt-1">Reservations and charging history</p>
        </div>
        <Link
          href="/availability"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New booking
        </Link>
      </div>
      <MyBookingsList
        userRfid={user.rfidTag}
        userId={user.id}
        bookings={JSON.parse(JSON.stringify(enriched))}
      />
    </div>
  );
}