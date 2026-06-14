import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { NotificationsPage } from "@/components/NotificationsPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="py-24 text-center text-slate-500">Sign in to view notifications.</div>;
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <NotificationsPage
      initialNotifications={JSON.parse(JSON.stringify(notifications))}
    />
  );
}