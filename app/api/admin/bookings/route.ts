import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const date = url.searchParams.get("date");          // YYYY-MM-DD
  const userId = url.searchParams.get("userId");
  const stationIdentity = url.searchParams.get("stationIdentity");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q");           // free text — searches user name
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

  const where: any = {};

  if (date) {
    const d = new Date(date + "T00:00:00");
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.startAt = { gte: d, lt: next };
  }
  if (userId) where.userId = parseInt(userId, 10);
  if (stationIdentity) where.stationIdentity = stationIdentity;
  if (status) where.status = status;
  if (search) {
    where.user = { name: { contains: search, mode: "insensitive" } };
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          department: true,
          carMake: true,
          carModel: true,
          carPlate: true,
          rfidTag: true,
        },
      },
    },
    orderBy: { startAt: "desc" },
    take: limit,
  });

  return Response.json({ bookings, count: bookings.length });
}