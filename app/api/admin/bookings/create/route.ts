import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { csmsAuthorizeTag } from "@/lib/csms";
import { SLOT_START_HOUR, SLOT_END_HOUR } from "@/lib/slots";

export async function POST(req: Request) {
  const admin = await requireAdmin();

  const body = await req.json();
  const {
    userId,
    stationIdentity,
    connectorId,
    startAt: startAtIso,
    bypassQuota = false,
  } = body;

  if (typeof userId !== "number") {
    return Response.json({ error: "userId required" }, { status: 400 });
  }
  if (!stationIdentity) {
    return Response.json({ error: "stationIdentity required" }, { status: 400 });
  }
  if (typeof connectorId !== "number" || connectorId < 1) {
    return Response.json({ error: "connectorId required" }, { status: 400 });
  }
  if (!startAtIso) {
    return Response.json({ error: "startAt required" }, { status: 400 });
  }

  const startAt = new Date(startAtIso);
  if (isNaN(startAt.getTime())) {
    return Response.json({ error: "Invalid startAt" }, { status: 400 });
  }
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

  // Sanity check: within slot window
  const hour = startAt.getHours();
  if (hour < SLOT_START_HOUR || hour >= SLOT_END_HOUR) {
    return Response.json({
      error: `Slot must be between ${SLOT_START_HOUR}:00 and ${SLOT_END_HOUR}:00`
    }, { status: 400 });
  }

  // Verify user exists
  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return Response.json({ error: "Target user not found" }, { status: 404 });
  }

  // Conflict check — booking
  const bookingConflict = await db.booking.findFirst({
    where: {
      stationIdentity,
      connectorId,
      status: { in: ["reserved", "active"] },
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
  });
  if (bookingConflict) {
    return Response.json({ error: "That slot is already booked" }, { status: 409 });
  }

  // Conflict check — maintenance block
  const maintenanceConflict = await db.maintenanceBlock.findFirst({
    where: {
      stationIdentity,
      connectorId,
      active: true,
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
  });
  if (maintenanceConflict) {
    return Response.json({
      error: `That slot is blocked for maintenance: ${maintenanceConflict.reason}`
    }, { status: 409 });
  }

  // Quota check (unless admin bypassed)
  if (!bypassQuota) {
    const startOfDay = new Date(startAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const dailyMinutesRule = await db.bookingRule.findUnique({
      where: { key: "daily_minutes_per_user" },
    });
    const dailyCap = parseInt(dailyMinutesRule?.value ?? "60", 10);

    const existing = await db.booking.findMany({
      where: {
        userId,
        startAt: { gte: startOfDay, lt: endOfDay },
        status: { in: ["reserved", "active", "completed"] },
      },
    });
    const minutesUsed = existing.reduce(
      (acc, b) => acc + (b.endAt.getTime() - b.startAt.getTime()) / 60000,
      0
    );
    if (minutesUsed + 60 > dailyCap) {
      return Response.json(
        {
          error: `User has used ${minutesUsed}min of ${dailyCap}min daily cap. Use bypassQuota to override.`,
          quotaUsed: minutesUsed,
          quotaCap: dailyCap,
        },
        { status: 400 }
      );
    }
  }

  const booking = await db.booking.create({
    data: {
      userId,
      stationIdentity,
      connectorId,
      startAt,
      endAt,
      status: "reserved",
      createdByAdminId: admin.id,
    },
  });

  try {
    await csmsAuthorizeTag({
      idTag: targetUser.rfidTag,
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

  return Response.json({
    ok: true,
    bookingId: booking.id,
    createdFor: targetUser.name,
    bypassedQuota: bypassQuota,
  });
}