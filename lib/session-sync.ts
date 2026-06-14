import { db } from "@/lib/db";
import { csmsSessions } from "@/lib/csms";

let lastSyncAt: Date | null = null;
const SYNC_THROTTLE_MS = 5000; // don't re-sync more often than every 5s

export async function syncSessionsFromCsms(): Promise<{ synced: number; skipped: boolean }> {
  // Throttle
  if (lastSyncAt && Date.now() - lastSyncAt.getTime() < SYNC_THROTTLE_MS) {
    return { synced: 0, skipped: true };
  }
  lastSyncAt = new Date();

  // Find the most recent session we already have, fetch anything newer
  const latest = await db.chargingSession.findFirst({
    where: { source: "real" },
    orderBy: { startTime: "desc" },
  });
  const since = latest?.startTime ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let sessions;
  try {
    sessions = await csmsSessions({ from: since, limit: 500 });
  } catch {
    return { synced: 0, skipped: false };
  }

  // Build lookup of users by RFID and known csmsSessionIds
  const users = await db.user.findMany();
  const usersByRfid = new Map(users.map((u) => [u.rfidTag, u]));
  const existing = await db.chargingSession.findMany({
    where: { csmsSessionId: { in: sessions.map((s) => s.id) } },
    select: { csmsSessionId: true },
  });
  const knownIds = new Set(existing.map((e) => e.csmsSessionId));

  let synced = 0;
  for (const s of sessions) {
    if (knownIds.has(s.id)) continue;
    const user = usersByRfid.get(s.id_tag);
    if (!user) continue; // session for an unknown RFID — skip

    const startTime = new Date(s.start_time);
    const stopTime = s.stop_time ? new Date(s.stop_time) : null;
    const durationSec = stopTime ? Math.round((stopTime.getTime() - startTime.getTime()) / 1000) : 0;

    await db.chargingSession.create({
      data: {
        csmsSessionId: s.id,
        userId: user.id,
        stationIdentity: s.station_identity,
        connectorId: s.connector_id,
        startTime,
        stopTime,
        energyWh: s.energy_wh ?? 0,
        durationSec,
        userNameSnap: user.name,
        userEmailSnap: user.email,
        departmentSnap: user.department,
        jobTitleSnap: user.jobTitle,
        employeeIdSnap: user.employeeId,
        carMakeSnap: user.carMake,
        carModelSnap: user.carModel,
        carYearSnap: user.carYear,
        source: "real",
      },
    });
    synced++;
  }

  return { synced, skipped: false };
}