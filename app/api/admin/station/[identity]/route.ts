import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ identity: string }> }) {
  await requireAdmin();
  const { identity } = await params;
  const stationIdentity = decodeURIComponent(identity);
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: any = { stationIdentity };
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) where.startTime.lte = new Date(to);
  }

  const sessions = await db.chargingSession.findMany({
    where,
    orderBy: { startTime: "asc" },
  });

  // Bucket by day
  const byDayMap = new Map<string, { sessions: number; energyWh: number }>();
  for (const s of sessions) {
    const day = s.startTime.toISOString().slice(0, 10);
    const e = byDayMap.get(day) ?? { sessions: 0, energyWh: 0 };
    e.sessions += 1;
    e.energyWh += s.energyWh;
    byDayMap.set(day, e);
  }
  const byDay = [...byDayMap.entries()]
    .map(([date, e]) => ({ date, sessions: e.sessions, energyWh: e.energyWh }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return Response.json({
    stationIdentity,
    totals: {
      sessions: sessions.length,
      energyWh: sessions.reduce((a, s) => a + s.energyWh, 0),
      occupiedSec: sessions.reduce((a, s) => a + s.durationSec, 0),
    },
    byDay,
  });
}