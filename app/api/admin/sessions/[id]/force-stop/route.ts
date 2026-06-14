import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { csmsRemoteStop } from "@/lib/csms";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sessionId = parseInt(id, 10);

  const session = await db.chargingSession.findUnique({ where: { id: sessionId } });
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  if (!session.csmsSessionId) {
    return Response.json({
      error: "This session has no CSMS transaction ID — likely a seeded demo session that cannot be remotely stopped.",
    }, { status: 400 });
  }

  if (session.stopTime) {
    return Response.json({ error: "Session is already stopped" }, { status: 400 });
  }

  try {
    await csmsRemoteStop(session.stationIdentity, session.csmsSessionId);
  } catch (e: any) {
    return Response.json({ error: `CSMS remote-stop failed: ${e.message}` }, { status: 502 });
  }

  // We don't update our local row here — the CSMS will emit a StopTransaction
  // shortly, and our sync job will pick it up on next dashboard load.
  return Response.json({ ok: true });
}