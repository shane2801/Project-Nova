import { requireAdmin } from "@/lib/admin-guard";
import { csmsRemoteStop } from "@/lib/csms";

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

  return Response.json({ ok: true });
}