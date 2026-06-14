import { db } from "@/lib/db";

export type NotificationType =
  | "booking_created"
  | "booking_created_by_admin"
  | "booking_cancelled_by_admin"
  | "transfer_invited"
  | "transfer_accepted"
  | "transfer_declined"
  | "session_start_soon"
  | "session_end_soon"
  | "transfer_cutoff"
  | "force_stopped"
  | "admin_user_released"
  | "admin_user_transferred"
  | "admin_user_no_show";

export type NotificationData = {
  bookingId?: number;
  transferId?: number;
  stationIdentity?: string;
  connectorId?: number;
  byUserId?: number;
  byUserName?: string;
};

export async function notify(opts: {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}) {
  await db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data ? JSON.stringify(opts.data) : null,
    },
  });
}

// Send a notification to every admin in the system
export async function notifyAllAdmins(opts: {
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}) {
  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data ? JSON.stringify(opts.data) : null,
    })),
  });
}