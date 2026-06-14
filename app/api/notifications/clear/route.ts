import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });

  await db.notification.deleteMany({
    where: { userId: user.id },
  });

  return Response.json({ ok: true });
}