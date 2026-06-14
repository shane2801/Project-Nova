import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const transferId = parseInt(id, 10);

  const tr = await db.transferRequest.findUnique({ where: { id: transferId } });
  if (!tr) return Response.json({ error: "Not found" }, { status: 404 });
  if (tr.fromUserId !== user.id) {
    return Response.json({ error: "Not your transfer" }, { status: 403 });
  }
  if (!["declined", "expired", "cancelled"].includes(tr.status)) {
    return Response.json({ error: "Not dismissible" }, { status: 400 });
  }

  // We mark it as "dismissed" by overwriting resolvedAt to far past so it falls out of recent window
  await db.transferRequest.update({
    where: { id: transferId },
    data: { resolvedAt: new Date(0) },
  });

  return Response.json({ ok: true });
}