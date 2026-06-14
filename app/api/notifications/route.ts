import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { startNotificationScheduler, runOnce } from "@/lib/notification-scheduler";

// Kick the singleton on first load (idempotent)
startNotificationScheduler();

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ notifications: [], unreadCount: 0 });

  // Safety net: also run scheduler on every GET, in case the singleton died
  // (idempotent thanks to per-notification dedup)
  runOnce().catch(() => null);

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  return Response.json({
    notifications: notifications.map((n) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
    })),
    unreadCount,
  });
}