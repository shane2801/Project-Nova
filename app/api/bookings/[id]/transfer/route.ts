import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notifications";
const TRANSFER_CUTOFF_MS = 60 * 60 * 1000; // must initiate at least 1h before booking start

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  const { toUserId } = await req.json();

  if (typeof toUserId !== "number") {
    return Response.json({ error: "toUserId required" }, { status: 400 });
  }
  if (toUserId === user.id) {
    return Response.json({ error: "Cannot transfer to yourself" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (booking.userId !== user.id) {
    return Response.json({ error: "You don't own this booking" }, { status: 403 });
  }
  if (booking.status !== "reserved") {
    return Response.json({ error: `Cannot transfer a ${booking.status} booking` }, { status: 400 });
  }

  // Enforce 1-hour-before-start cutoff
  const now = new Date();
  const cutoff = new Date(booking.startAt.getTime() - TRANSFER_CUTOFF_MS);
  if (now > cutoff) {
    const minsToStart = Math.round((booking.startAt.getTime() - now.getTime()) / 60000);
    return Response.json(
      {
        error:
          minsToStart > 0
            ? `Transfers must be initiated at least 1 hour before the booking starts. This booking starts in ${minsToStart} min.`
            : "Booking has already started. Transfers are no longer allowed.",
      },
      { status: 400 }
    );
  }

  const recipient = await db.user.findUnique({ where: { id: toUserId } });
  if (!recipient) return Response.json({ error: "Recipient not found" }, { status: 404 });

  // Block duplicate pending invites
  const existing = await db.transferRequest.findFirst({
    where: { bookingId, status: "pending" },
  });
  if (existing) {
    return Response.json({ error: "A pending invite already exists for this booking" }, { status: 409 });
  }

  const tr = await db.transferRequest.create({
    data: {
      bookingId,
      fromUserId: user.id,
      toUserId,
      status: "pending",
    },
  });
await notify({
  userId: toUserId,
  type: "transfer_invited",
  title: "Booking transfer request",
  body: `${user.name} wants to transfer a ${booking.stationIdentity} booking to you (starts ${booking.startAt.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })})`,
  data: {
    bookingId: booking.id,
    transferId: tr.id,
    byUserId: user.id,
    byUserName: user.name,
  },
});
  return Response.json({ ok: true, transferId: tr.id });
}