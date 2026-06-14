import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const session = await db.chargingSession.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  const booking = await db.booking.findFirst({
    where: {
      userId: session.userId,
      stationIdentity: session.stationIdentity,
      startAt: { lte: session.startTime },
      endAt: { gte: session.startTime },
    },
  });

  return Response.json({
    session,
    booking: booking
      ? {
          id: booking.id,
          startAt: booking.startAt,
          endAt: booking.endAt,
          status: booking.status,
        }
      : null,
  });
}