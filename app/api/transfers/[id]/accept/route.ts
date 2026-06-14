import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsRevokeTag, csmsAuthorizeTag } from "@/lib/csms";
import { minutesUsedToday, dailyCapMinutes } from "@/lib/quota";
import { notify, notifyAllAdmins } from "@/lib/notifications";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const transferId = parseInt(id, 10);

  const tr = await db.transferRequest.findUnique({
    where: { id: transferId },
    include: { booking: true, fromUser: true },
  });
  if (!tr) return Response.json({ error: "Transfer not found" }, { status: 404 });
  if (tr.toUserId !== user.id) {
    return Response.json({ error: "This transfer is not for you" }, { status: 403 });
  }
  if (tr.status !== "pending") {
    return Response.json({ error: `Transfer already ${tr.status}` }, { status: 400 });
  }
  if (tr.booking.startAt <= new Date()) {
    await db.transferRequest.update({
      where: { id: transferId },
      data: { status: "expired", resolvedAt: new Date() },
    });
    return Response.json({ error: "Booking has already started" }, { status: 400 });
  }
  if (tr.booking.status !== "reserved") {
    return Response.json({ error: `Cannot accept — booking is ${tr.booking.status}` }, { status: 400 });
  }

  // Validate recipient's daily quota
  const bookingMinutes = (tr.booking.endAt.getTime() - tr.booking.startAt.getTime()) / 60000;
  const used = await minutesUsedToday(user.id);
  const cap = await dailyCapMinutes();
  if (used + bookingMinutes > cap) {
    return Response.json(
      { error: `Daily cap of ${cap}min would be exceeded (you have ${used}min booked).` },
      { status: 400 }
    );
  }

  // Swap CSMS auth tag
  await csmsRevokeTag(tr.fromUser.rfidTag).catch(() => { });
  try {
    await csmsAuthorizeTag({
      idTag: user.rfidTag,
      validFrom: tr.booking.startAt,
      validTo: tr.booking.endAt,
      stationIdentity: tr.booking.stationIdentity,
    });
  } catch (err: any) {
    // Try to restore sender's tag
    await csmsAuthorizeTag({
      idTag: tr.fromUser.rfidTag,
      validFrom: tr.booking.startAt,
      validTo: tr.booking.endAt,
      stationIdentity: tr.booking.stationIdentity,
    }).catch(() => { });
    return Response.json({ error: `CSMS rejected: ${err.message}` }, { status: 502 });
  }

  // Transfer ownership + record the original owner
  await db.$transaction([
    db.booking.update({
      where: { id: tr.bookingId },
      data: {
        userId: user.id,
        transferredFromUserId: tr.fromUserId,
      },
    }),
    db.transferRequest.update({
      where: { id: transferId },
      data: { status: "accepted", resolvedAt: new Date() },
    }),
  ]);
  await notify({
    userId: tr.fromUserId,
    type: "transfer_accepted",
    title: "Transfer accepted",
    body: `${user.name} accepted your ${tr.booking.stationIdentity} booking transfer`,
    data: {
      bookingId: tr.bookingId,
      transferId: tr.id,
      byUserId: user.id,
      byUserName: user.name,
    },
  });

  await notifyAllAdmins({
  type: "admin_user_transferred",
  title: "Booking transferred between users",
  body: `${tr.booking.stationIdentity} booking moved from previous holder to ${user.name} (${tr.booking.startAt.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })})`,
  data: {
    bookingId: tr.bookingId,
    transferId: tr.id,
    stationIdentity: tr.booking.stationIdentity,
    connectorId: tr.booking.connectorId,
    byUserId: user.id,
    byUserName: user.name,
  },
});
  return Response.json({ ok: true });
}