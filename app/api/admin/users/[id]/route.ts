import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const COST_PER_KWH = 9.5; // MUR

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const userId = parseInt(id, 10);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const sessions = await db.chargingSession.findMany({
    where: { userId },
    orderBy: { startTime: "desc" },
    take: 200,
  });

  const bookings = await db.booking.findMany({
    where: { userId },
    orderBy: { startAt: "desc" },
    take: 500,
  });

  // No-shows: a booking whose window has fully passed with no overlapping session
  const now = new Date();
  const noShows = bookings.filter((b) => {
    if (b.endAt > now) return false;
    if (b.status === "released" || b.status === "cancelled") return false;
    const overlapping = sessions.find(
      (s) => s.startTime >= b.startAt && s.startTime <= b.endAt
    );
    return !overlapping;
  });

  const totalEnergyWh = sessions.reduce((a, s) => a + s.energyWh, 0);
  const totalKwh = totalEnergyWh / 1000;
  const totalCostMur = totalKwh * COST_PER_KWH;

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      department: user.department,
      jobTitle: user.jobTitle,
      joinedAt: user.joinedAt,
      carMake: user.carMake,
      carModel: user.carModel,
      carYear: user.carYear,
      carPlate: user.carPlate,
      rfidTag: user.rfidTag,
    },
    stats: {
      sessionCount: sessions.length,
      bookingsCount: bookings.length,
      noShows: noShows.length,
      totalKwh,
      totalCostMur,
    },
    recentSessions: sessions.slice(0, 20),
    recentBookings: bookings.slice(0, 20),
  });
}