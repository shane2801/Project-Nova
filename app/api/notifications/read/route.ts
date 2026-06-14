import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ids } = body;  // optional array of specific IDs; if omitted, mark all read

  if (Array.isArray(ids) && ids.length > 0) {
    await db.notification.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data: { readAt: new Date() },
    });
  } else {
    await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return Response.json({ ok: true });
}