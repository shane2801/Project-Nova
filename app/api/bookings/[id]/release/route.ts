import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsRevokeTag } from "@/lib/csms";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { user: true } });
  if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
  if (booking.userId !== user.id && user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "reserved") {
    return Response.json({ error: `Cannot release a ${booking.status} booking` }, { status: 400 });
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "released" },
  });
  await csmsRevokeTag(booking.user.rfidTag).catch(() => {});

  return Response.json({ ok: true });
}