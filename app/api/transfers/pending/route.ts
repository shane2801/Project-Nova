import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsStations } from "@/lib/csms";

const RECENT_HOURS = 24;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ incoming: [], outgoing: [], recentResolved: [] });

  const incoming = await db.transferRequest.findMany({
    where: { toUserId: user.id, status: "pending" },
    include: {
      fromUser: { select: { id: true, name: true, email: true, employeeId: true } },
      booking: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const outgoing = await db.transferRequest.findMany({
    where: { fromUserId: user.id, status: "pending" },
    include: {
      toUser: { select: { id: true, name: true, email: true, employeeId: true } },
      booking: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Recent declines / expires for the sender — show as a card so they know
  const recentCutoff = new Date(Date.now() - RECENT_HOURS * 60 * 60 * 1000);
  const recentResolved = await db.transferRequest.findMany({
    where: {
      fromUserId: user.id,
      status: { in: ["declined", "expired"] },
      resolvedAt: { gte: recentCutoff },
    },
    include: {
      toUser: { select: { id: true, name: true, email: true, employeeId: true } },
      booking: true,
    },
    orderBy: { resolvedAt: "desc" },
    take: 5,
  });

  // Enrich with station location
  const stationIds = [
    ...incoming.map((t) => t.booking.stationIdentity),
    ...outgoing.map((t) => t.booking.stationIdentity),
    ...recentResolved.map((t) => t.booking.stationIdentity),
  ];
  const stationMap = new Map<string, string | null>();
  if (stationIds.length) {
    try {
      const stations = await csmsStations();
      for (const s of stations) stationMap.set(s.identity, s.location);
    } catch {
      // best-effort
    }
  }

  function enrich(t: any) {
    return {
      ...t,
      booking: {
        ...t.booking,
        location: stationMap.get(t.booking.stationIdentity) ?? null,
      },
    };
  }

  return Response.json({
    incoming: incoming.map(enrich),
    outgoing: outgoing.map(enrich),
    recentResolved: recentResolved.map(enrich),
  });
}