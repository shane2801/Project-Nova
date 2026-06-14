import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { startSimulator, toJSON, listActiveRuns } from "@/lib/simulator";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    identity,
    tag,
    duration = 120,
    power = 7400,
    interval = 10,
  } = body;

  // Default tag to current user's RFID if not provided
  const resolvedTag = tag || user.rfidTag;

  // Default identity to the user's most recent active booking station, if any
  let resolvedIdentity = identity;
  if (!resolvedIdentity) {
    const booking = await db.booking.findFirst({
      where: {
        userId: user.id,
        status: { in: ["reserved", "active"] },
        endAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
    });
    resolvedIdentity = booking?.stationIdentity;
  }

  if (!resolvedIdentity) {
    return Response.json(
      { error: "No active booking found. Book a charger first, or specify a station." },
      { status: 400 }
    );
  }

  // Prevent two simulators against the same identity simultaneously
  const already = listActiveRuns().find((r) => r.identity === resolvedIdentity);
  if (already) {
    return Response.json(
      { error: `A simulator is already running for ${resolvedIdentity}.`, runId: already.id },
      { status: 409 }
    );
  }

  const numDuration = Math.max(10, Math.min(3600, Number(duration) || 120));
  const numPower = Math.max(0, Math.min(22000, Number(power) || 7400));
  const numInterval = Math.max(1, Math.min(60, Number(interval) || 10));

  try {
    const run = startSimulator({
      identity: resolvedIdentity,
      tag: resolvedTag,
      duration: numDuration,
      power: numPower,
      interval: numInterval,
    });
    return Response.json({ ok: true, run: toJSON(run) });
  } catch (err: any) {
    return Response.json({ error: `Failed to spawn: ${err.message}` }, { status: 500 });
  }
}