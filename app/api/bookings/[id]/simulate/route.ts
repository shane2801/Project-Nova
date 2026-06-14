import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsAuthorizeTag, csmsSessions } from "@/lib/csms";
import { startSimulator, toJSON, listActiveRuns } from "@/lib/simulator";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  const body = await req.json().catch(() => ({}));
  const { duration: durationOverride, power = 7400, interval = 10 } = body;

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (booking.userId !== user.id) {
    return Response.json({ error: "Not your booking" }, { status: 403 });
  }
  if (!["reserved", "active"].includes(booking.status)) {
    return Response.json({ error: `Cannot simulate a ${booking.status} booking` }, { status: 400 });
  }

  // Reject if simulator already running for this station
  const already = listActiveRuns().find((r) => r.identity === booking.stationIdentity);
  if (already) {
    return Response.json(
      { error: `A simulator is already running for ${booking.stationIdentity}` },
      { status: 409 }
    );
  }

  // Duration defaults to booking length in seconds (capped to a sensible demo size)
  const bookingDurationSec = Math.round(
    (booking.endAt.getTime() - booking.startAt.getTime()) / 1000
  );
  const duration = Math.max(
    10,
    Math.min(3500, Number(durationOverride) || bookingDurationSec)
  );
  const numPower = Math.max(0, Math.min(22000, Number(power) || 7400));
  const numInterval = Math.max(1, Math.min(60, Number(interval) || 10));

  // Push a real-time auth tag so the simulator can authorize NOW
  const now = new Date();
  const validTo = new Date(now.getTime() + duration * 1000); // +60s buffer
  try {
    await csmsAuthorizeTag({
      idTag: user.rfidTag,
      validFrom: now,
      validTo,
      stationIdentity: booking.stationIdentity,
    });
  } catch (err: any) {
    return Response.json({ error: `CSMS auth push failed: ${err.message}` }, { status: 502 });
  }

  // Spawn the simulator
  let run;
  try {
    run = startSimulator({
      identity: booking.stationIdentity,
      tag: user.rfidTag,
      duration,
      power: numPower,
      interval: numInterval,
    });
  } catch (err: any) {
    return Response.json({ error: `Spawn failed: ${err.message}` }, { status: 500 });
  }

  // Mark the booking as simulated NOW (session ID gets filled in after CSMS picks it up)
  await db.booking.update({
    where: { id: bookingId },
    data: { simulatedAt: now },
  });

  return Response.json({ ok: true, run: toJSON(run), bookingId });
}