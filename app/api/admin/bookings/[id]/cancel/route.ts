import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { csmsRevokeTag } from "@/lib/csms";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const bookingId = parseInt(id, 10);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { user: true },
  });
  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status === "cancelled" || booking.status === "completed") {
    return Response.json({ error: `Booking already ${booking.status}` }, { status: 400 });
  }

  // Update DB
  const updated = await db.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  });

  // Revoke CSMS tag — best-effort, don't fail the whole cancel if CSMS is down
  try {
    await csmsRevokeTag(booking.user.rfidTag);
  } catch (e) {
    console.error("CSMS revoke failed during admin cancel:", e);
  }

  return Response.json({
    ok: true,
    booking: updated,
    cancelledBy: admin.name,
  });
}