import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const KNOWN_RULES = [
  "daily_minutes_per_user",
  "slot_duration_minutes",
  "booking_window_days",
  "reminder_lead_minutes",
  "transfer_cutoff_minutes",
];

export async function GET() {
  await requireAdmin();
  const rules = await db.bookingRule.findMany({
    where: { key: { in: KNOWN_RULES } },
  });
  // Return as an object keyed by rule name for convenience
  const result: Record<string, { value: string; updatedAt: string }> = {};
  for (const r of rules) {
    result[r.key] = { value: r.value, updatedAt: r.updatedAt.toISOString() };
  }
  return Response.json(result);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Body must be an object of {key: value}" }, { status: 400 });
  }

  // Validate each rule
  const updates: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!KNOWN_RULES.includes(key)) {
      return Response.json({ error: `Unknown rule: ${key}` }, { status: 400 });
    }
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) {
      return Response.json({ error: `Rule ${key} must be a non-negative integer` }, { status: 400 });
    }
    // Sanity caps so admin can't break the app with absurd values
    if (key === "daily_minutes_per_user" && (num < 15 || num > 480)) {
      return Response.json({ error: "Daily cap must be between 15 and 480 minutes" }, { status: 400 });
    }
    if (key === "slot_duration_minutes" && ![30, 60].includes(num)) {
      return Response.json({ error: "Slot duration must be 30 or 60 minutes" }, { status: 400 });
    }
    if (key === "booking_window_days" && (num < 1 || num > 30)) {
      return Response.json({ error: "Booking window must be 1 to 30 days" }, { status: 400 });
    }
    if (key === "reminder_lead_minutes" && (num < 0 || num > 120)) {
      return Response.json({ error: "Reminder lead time must be 0 to 120 minutes" }, { status: 400 });
    }
    if (key === "transfer_cutoff_minutes" && (num < 0 || num > 1440)) {
      return Response.json({ error: "Transfer cutoff must be 0 to 1440 minutes" }, { status: 400 });
    }
    updates.push({ key, value: String(num) });
  }

  // Upsert all in one transaction
  await db.$transaction(
    updates.map((u) =>
      db.bookingRule.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      })
    )
  );

  return Response.json({ ok: true, updated: updates.length });
}