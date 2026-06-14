import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const CSMS_BASE_URL = process.env.CSMS_BASE_URL ?? "http://localhost:3000";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const blockId = parseInt(id, 10);

  const block = await db.maintenanceBlock.findUnique({ where: { id: blockId } });
  if (!block) return Response.json({ error: "Block not found" }, { status: 404 });
  if (!block.active) return Response.json({ error: "Block already lifted" }, { status: 400 });

  // Try CSMS unblock (best effort)
if (block.csmsBlocked) {
  try {
    const res = await fetch(
      `${CSMS_BASE_URL}/api/stations/${block.stationIdentity}/connectors/${block.connectorId}/block`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      console.warn(`CSMS unblock failed: ${res.status}`);
    }
  } catch (err) {
    console.warn("CSMS unblock error:", err);
  }
}

  await db.maintenanceBlock.update({
    where: { id: blockId },
    data: { active: false },
  });

  return Response.json({ ok: true });
}