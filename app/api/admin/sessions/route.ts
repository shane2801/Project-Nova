import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { syncSessionsFromCsms } from "@/lib/session-sync";

export async function GET(req: Request) {
  await requireAdmin();
  await syncSessionsFromCsms().catch(() => null);

  const url = new URL(req.url);
  const date = url.searchParams.get("date");          // YYYY-MM-DD — single day
  const from = url.searchParams.get("from");          // ISO range start
  const to = url.searchParams.get("to");              // ISO range end
  const userId = url.searchParams.get("userId");
  const stationIdentity = url.searchParams.get("stationIdentity");
  const carMake = url.searchParams.get("carMake");
  const limit = parseInt(url.searchParams.get("limit") ?? "200", 10);

  const where: any = {};

  if (date) {
    const d = new Date(date + "T00:00:00");
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.startTime = { gte: d, lt: next };
  } else if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) where.startTime.lte = new Date(to);
  }

  if (userId) where.userId = parseInt(userId, 10);
  if (stationIdentity) where.stationIdentity = stationIdentity;
  if (carMake) where.carMakeSnap = carMake;

  const sessions = await db.chargingSession.findMany({
    where,
    orderBy: { startTime: "desc" },
    take: limit,
  });

  return Response.json({ sessions, count: sessions.length });
}