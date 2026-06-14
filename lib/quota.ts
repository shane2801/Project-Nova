import { db } from "@/lib/db";

export async function minutesUsedToday(userId: number, now: Date = new Date()): Promise<number> {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const bookings = await db.booking.findMany({
    where: {
      userId,
      startAt: { gte: startOfDay, lt: endOfDay },
      status: { in: ["reserved", "active", "completed"] },
    },
  });

  return bookings.reduce(
    (acc, b) => acc + (b.endAt.getTime() - b.startAt.getTime()) / 60000,
    0
  );
}

export async function dailyCapMinutes(): Promise<number> {
  const rule = await db.bookingRule.findUnique({
    where: { key: "daily_minutes_per_user" },
  });
  return parseInt(rule?.value ?? "60", 10);
}