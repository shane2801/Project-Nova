import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const transferId = parseInt(id, 10);

  const tr = await db.transferRequest.findUnique({ where: { id: transferId } });
  if (!tr) return Response.json({ error: "Not found" }, { status: 404 });
  if (tr.toUserId !== user.id) {
    return Response.json({ error: "Not your transfer" }, { status: 403 });
  }
  if (tr.status !== "pending") {
    return Response.json({ error: `Already ${tr.status}` }, { status: 400 });
  }

  await db.transferRequest.update({
    where: { id: transferId },
    data: { status: "declined", resolvedAt: new Date() },
  });

  return Response.json({ ok: true });
}