import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { csmsStations } from "@/lib/csms";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json(null);

  const next = await db.booking.findFirst({
    where: {
      userId: user.id,
      startAt: { gte: new Date() },
      status: { in: ["reserved", "active"] },
    },
    orderBy: { startAt: "asc" },
  });

  if (!next) return Response.json(null);

  let location: string | null = null;
  try {
    const stations = await csmsStations();
    const station = stations.find((s) => s.identity === next.stationIdentity);
    location = station?.location ?? null;
  } catch {
    // best-effort
  }

  return Response.json({
    ...next,
    location,
  });
}