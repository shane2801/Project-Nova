import { db } from "@/lib/db";
import { notify, type NotificationType } from "@/lib/notifications";

const POLL_INTERVAL_MS = 60_000;  // every 60 seconds

// globalThis cache survives Next.js dev hot-reload
declare global {
  var __notificationSchedulerStarted: boolean | undefined;
}

export function startNotificationScheduler() {
  if (globalThis.__notificationSchedulerStarted) return;
  globalThis.__notificationSchedulerStarted = true;

  console.log("[notification-scheduler] starting, polls every 60s");

  // Kick once immediately so the first tick doesn't wait 60s
  runOnce().catch((err) => console.error("[notification-scheduler] initial run failed:", err));

  setInterval(() => {
    runOnce().catch((err) => console.error("[notification-scheduler] tick failed:", err));
  }, POLL_INTERVAL_MS);
}

// Public entry point — also called from /api/notifications GET as a safety net
export async function runOnce() {
  const now = new Date();

  // Window of 1 minute starting at "T - threshold", giving us [T - threshold, T - threshold + 1min]
  // We look at bookings whose startAt or endAt falls in those windows.

  // Threshold 1: 1 hour before start (only for reserved bookings — active/completed/cancelled don't qualify)
  await checkThreshold({
    label: "transfer_cutoff",
    minutesBefore: 60,
    type: "transfer_cutoff",
    matchOn: "start",
    statusIn: ["reserved"],
    title: "Booking starts in 1 hour",
    body: (b) => `${b.stationIdentity} · Connector ${b.connectorId} starts at ${formatTime(b.startAt)}. You can no longer transfer this booking.`,
    now,
  });

  // Threshold 2: 10 min before start
  await checkThreshold({
    label: "session_start_soon",
    minutesBefore: 10,
    type: "session_start_soon",
    matchOn: "start",
    statusIn: ["reserved", "active"],
    title: "Booking starts in 10 minutes",
    body: (b) => `${b.stationIdentity} · Connector ${b.connectorId} at ${formatTime(b.startAt)}. Plug in your car to begin charging.`,
    now,
  });

  // Threshold 3: 10 min before end (only if booking is "active" — they actually plugged in)
  await checkThreshold({
    label: "session_end_soon",
    minutesBefore: 10,
    type: "session_end_soon",
    matchOn: "end",
    statusIn: ["active"],
    title: "Booking ends in 10 minutes",
    body: (b) => `${b.stationIdentity} ends at ${formatTime(b.endAt)}. Please disconnect and move your car by then.`,
    now,
  });
}

type Threshold = {
  label: string;
  minutesBefore: number;
  type: NotificationType;
  matchOn: "start" | "end";
  statusIn: string[];
  title: string;
  body: (booking: any) => string;
  now: Date;
};

async function checkThreshold(t: Threshold) {
  const windowStart = new Date(t.now.getTime() + t.minutesBefore * 60_000);
  const windowEnd = new Date(windowStart.getTime() + POLL_INTERVAL_MS);

  const where: any = {
    status: { in: t.statusIn },
  };
  if (t.matchOn === "start") {
    where.startAt = { gte: windowStart, lt: windowEnd };
  } else {
    where.endAt = { gte: windowStart, lt: windowEnd };
  }

  const bookings = await db.booking.findMany({
    where,
    include: { user: true },
  });

  if (bookings.length === 0) return;

  for (const b of bookings) {
    // Dedup: skip if this exact (userId, type, bookingId) notification already exists
    const existing = await db.notification.findFirst({
      where: {
        userId: b.userId,
        type: t.type,
        data: { contains: `"bookingId":${b.id}` },
      },
      select: { id: true },
    });
    if (existing) continue;

    await notify({
      userId: b.userId,
      type: t.type,
      title: t.title,
      body: t.body(b),
      data: {
        bookingId: b.id,
        stationIdentity: b.stationIdentity,
        connectorId: b.connectorId,
      },
    });
    console.log(`[notification-scheduler] sent ${t.label} for booking ${b.id} (user ${b.userId})`);
  }
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}