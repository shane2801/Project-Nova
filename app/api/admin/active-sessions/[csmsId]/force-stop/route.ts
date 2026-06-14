import { requireAdmin } from "@/lib/admin-guard";
import { csmsRemoteStop } from "@/lib/csms";
import { notify, notifyAllAdmins } from "@/lib/notifications";
export async function POST(req: Request, { params }: { params: Promise<{ csmsId: string }> }) {
  await requireAdmin();
  const { csmsId } = await params;
  const transactionId = parseInt(csmsId, 10);

  // Optional body to specify station identity (we already get it in the URL via the session)
  const body = await req.json().catch(() => ({}));
  const stationIdentity = body.stationIdentity;
  if (!stationIdentity) {
    return Response.json({ error: "Missing stationIdentity in body" }, { status: 400 });
  }

  try {
    await csmsRemoteStop(stationIdentity, transactionId);
  } catch (e: any) {
    return Response.json({ error: `CSMS remote-stop failed: ${e.message}` }, { status: 502 });
  }

  // Find which user this session belonged to (by id_tag → rfidTag)
const sessionDetail = await csmsSessionDetail(csmsTransactionId);
const targetUser = sessionDetail?.id_tag
  ? await db.user.findUnique({ where: { rfidTag: sessionDetail.id_tag } })
  : null;

if (targetUser) {
  // Notify the user their session was stopped
  await notify({
    userId: targetUser.id,
    type: "force_stopped",
    title: "Your charging session was stopped",
    body: `An admin (${admin.name}) stopped your charging session at ${sessionDetail.station_identity}. Please contact the Workplace team if you need help.`,
    data: {
      stationIdentity: sessionDetail.station_identity,
      connectorId: sessionDetail.connector_id,
      byUserId: admin.id,
      byUserName: admin.name,
    },
  });

  // Notify admins for audit trail
  await notifyAllAdmins({
    type: "force_stopped",
    title: "Session force-stopped",
    body: `${admin.name} force-stopped ${targetUser.name}'s session at ${sessionDetail.station_identity}`,
    data: {
      stationIdentity: sessionDetail.station_identity,
      connectorId: sessionDetail.connector_id,
      byUserId: admin.id,
      byUserName: admin.name,
    },
  });
}

  return Response.json({ ok: true });
}