import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsAuthorizeTag } from "@/lib/csms";
import { SLOT_START_HOUR, SLOT_END_HOUR } from "@/lib/slots";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
const { stationIdentity, connectorId, startAt: startAtIso } = body;
if (!stationIdentity) {
  return Response.json({ error: "stationIdentity required" }, { status: 400 });
}
if (typeof connectorId !== "number" || connectorId < 1) {
  return Response.json({ error: "connectorId required" }, { status: 400 });
}


  // Parse requested start time
  const startAt = startAtIso ? new Date(startAtIso) : nextRoundHour(new Date());
  if (isNaN(startAt.getTime())) {
    return Response.json({ error: "Invalid startAt" }, { status: 400 });
  }
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const now = new Date();

  // Same-day only
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday); endOfToday.setDate(endOfToday.getDate() + 1);
  if (startAt < startOfToday || startAt >= endOfToday) {
    return Response.json({ error: "Bookings are for today only." }, { status: 400 });
  }

  // Within 8am–10pm
  const hour = startAt.getHours();
  if (hour < SLOT_START_HOUR || hour >= SLOT_END_HOUR) {
    return Response.json({ error: `Slots are between ${SLOT_START_HOUR}:00 and ${SLOT_END_HOUR}:00.` }, { status: 400 });
  }

  // Not in the past
  if (endAt <= now) {
    return Response.json({ error: "Cannot book a slot that's already over." }, { status: 400 });
  }

  // Daily quota
  const dailyMinutesRule = await db.bookingRule.findUnique({
    where: { key: "daily_minutes_per_user" },
  });
  const dailyCap = parseInt(dailyMinutesRule?.value ?? "60", 10);

  const existing = await db.booking.findMany({
    where: {
      userId: user.id,
      startAt: { gte: startOfToday, lt: endOfToday },
      status: { in: ["reserved", "active", "completed"] },
    },
  });
  const minutesUsed = existing.reduce(
    (acc, b) => acc + (b.endAt.getTime() - b.startAt.getTime()) / 60000,
    0
  );
  if (minutesUsed + 60 > dailyCap) {
    return Response.json(
      { error: `Daily cap of ${dailyCap}min already used (${minutesUsed}min booked).` },
      { status: 400 }
    );
  }

  // Conflict check on this station for this exact slot
const conflict = await db.booking.findFirst({
  where: {
    stationIdentity,
    connectorId,
    status: { in: ["reserved", "active"] },
    AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
  },
});
  if (conflict) {
    return Response.json({ error: "That slot is already booked." }, { status: 409 });
  }

const booking = await db.booking.create({
  data: {
    userId: user.id,
    stationIdentity,
    connectorId,
    startAt,
    endAt,
    status: "reserved",
  },
});

  try {
    await csmsAuthorizeTag({
      idTag: user.rfidTag,
      validFrom: startAt,
      validTo: endAt,
      stationIdentity,
    });
  } catch (err: any) {
    await db.booking.delete({ where: { id: booking.id } });
    return Response.json(
      { error: `CSMS rejected: ${err.message}` },
      { status: 502 }
    );
  }

  return Response.json({ ok: true, bookingId: booking.id });
}

function nextRoundHour(d: Date) {
  const out = new Date(d);
  out.setMinutes(0, 0, 0);
  if (out <= d) out.setHours(out.getHours() + 1);
  return out;
}