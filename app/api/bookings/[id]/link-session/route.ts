import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsSessions } from "@/lib/csms";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
  if (booking.userId !== user.id) {
    return Response.json({ error: "Not your booking" }, { status: 403 });
  }
  if (!booking.simulatedAt) {
    return Response.json({ error: "Not a simulated booking" }, { status: 400 });
  }
  if (booking.simulatedSessionId) {
    return Response.json({ ok: true, sessionId: booking.simulatedSessionId });
  }

  // Find a session for this RFID that started at/after simulatedAt
  const sessions = await csmsSessions({
    idTag: user.rfidTag,
    from: booking.simulatedAt,
  });
  // Take the most recent one matching this station
  const session = sessions
    .filter((s) => s.station_identity === booking.stationIdentity)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

  if (!session) return Response.json({ ok: false, sessionId: null });

  await db.booking.update({
    where: { id: bookingId },
    data: { simulatedSessionId: session.id },
  });
  return Response.json({ ok: true, sessionId: session.id });
}