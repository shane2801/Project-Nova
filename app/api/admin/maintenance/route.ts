import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const CSMS_BASE_URL = process.env.CSMS_BASE_URL ?? "http://localhost:3000/";
console.log("[maintenance] CSMS_BASE_URL is:", CSMS_BASE_URL);


export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const stationIdentity = url.searchParams.get("stationIdentity");
  const activeOnly = url.searchParams.get("activeOnly") !== "false";

  const where: any = {};
  if (stationIdentity) where.stationIdentity = stationIdentity;
  if (activeOnly) where.active = true;

  const blocks = await db.maintenanceBlock.findMany({
    where,
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { startAt: "desc" },
    take: 100,
  });

  return Response.json({ blocks });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  const body = await req.json();
  const { stationIdentity, connectorId, startAt: startAtIso, endAt: endAtIso, reason } = body;

  if (!stationIdentity) return Response.json({ error: "stationIdentity required" }, { status: 400 });
  if (typeof connectorId !== "number") return Response.json({ error: "connectorId required" }, { status: 400 });
  if (!startAtIso || !endAtIso) return Response.json({ error: "startAt and endAt required" }, { status: 400 });
  if (!reason?.trim()) return Response.json({ error: "reason required" }, { status: 400 });

  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    return Response.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (endAt <= startAt) {
    return Response.json({ error: "endAt must be after startAt" }, { status: 400 });
  }

  // Check for booking conflicts
  const bookingConflict = await db.booking.findFirst({
    where: {
      stationIdentity,
      connectorId,
      status: { in: ["reserved", "active"] },
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
    include: { user: { select: { name: true } } },
  });
  if (bookingConflict) {
    return Response.json({
      error: `Conflicts with booking by ${bookingConflict.user.name}. Cancel that booking first.`,
    }, { status: 409 });
  }

  // Send block to CSMS: PUT /stations/{id}/connectors/{c}/block with reason in body
  let csmsBlocked = false;
  let csmsError: string | null = null;
  const csmsUrl = `${CSMS_BASE_URL}/stations/${stationIdentity}/connectors/${connectorId}/block`;
  const csmsBody = JSON.stringify({
    reason: `${reason.trim()} (scheduled until ${endAt.toLocaleString()})`,
  });

  try {
    const res = await fetch(csmsUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: csmsBody,
    });
    if (res.ok) {
      csmsBlocked = true;
    } else {
      const errBody = await res.text().catch(() => "");
      csmsError = `CSMS ${res.status}: ${errBody.slice(0, 200)}`;
      console.error("CSMS block failed:", csmsUrl, csmsError);
    }
  } catch (err: any) {
    csmsError = `Network: ${err.message}`;
    console.error("CSMS block exception:", csmsUrl, err);
  }
  const block = await db.maintenanceBlock.create({
    data: {
      stationIdentity,
      connectorId,
      startAt,
      endAt,
      reason: reason.trim(),
      createdByUserId: admin.id,
      csmsBlocked,
      active: true,
    },
  });

  return Response.json({
    ok: true,
    block,
    csmsBlocked,
    warning: csmsBlocked ? null : (csmsError ?? "CSMS did not block the connector"),
  });
}