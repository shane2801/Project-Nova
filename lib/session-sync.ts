import { db } from "@/lib/db";
import { csmsSessions, csmsSessionDetail } from "@/lib/csms";
let lastSyncAt: Date | null = null;
const SYNC_THROTTLE_MS = 5000;

export async function syncSessionsFromCsms(): Promise<{ synced: number; updated: number; skipped: boolean }> {
  if (lastSyncAt && Date.now() - lastSyncAt.getTime() < SYNC_THROTTLE_MS) {
    return { synced: 0, updated: 0, skipped: true };
  }
  lastSyncAt = new Date();

  // Pull recent CSMS sessions. We want both new ones AND updates to active ones
  // that may have just stopped. So we go back 24h, not just from the latest startTime.
  const lookback = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let sessions;
  try {
    sessions = await csmsSessions({ from: lookback, limit: 500 });
  } catch {
    return { synced: 0, updated: 0, skipped: false };
  }

  const users = await db.user.findMany();
  const usersByRfid = new Map(users.map((u) => [u.rfidTag, u]));

  // Get existing rows for these CSMS session IDs
  const csmsIds = sessions.map((s) => s.id);
  const existingRows = await db.chargingSession.findMany({
    where: { csmsSessionId: { in: csmsIds } },
  });
  const existingByCsmsId = new Map(existingRows.map((r) => [r.csmsSessionId!, r]));

  let synced = 0;
  let updated = 0;

  for (const s of sessions) {
    const startTime = new Date(s.start_time);
    const stopTime = s.stop_time ? new Date(s.stop_time) : null;
    const durationSec = stopTime ? Math.round((stopTime.getTime() - startTime.getTime()) / 1000) : 0;
    const energyWh = s.energy_wh ?? 0;

    const existing = existingByCsmsId.get(s.id);

    if (existing) {
      let liveEnergyWh = energyWh;

      // If session is still running, energy_wh on the row is 0.
      // Compute it from meter values via the detail endpoint.
      if (!stopTime) {
        try {
          const detail = await csmsSessionDetail(s.id);
          // Latest energy reading minus meter_start
          const energyValues = detail.meter_values
            .filter((mv) => mv.measurand === "Energy.Active.Import.Register")
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (energyValues.length > 0) {
            liveEnergyWh = Math.max(0, energyValues[0].value - detail.meter_start);
          }
        } catch {
          // Detail call failed — fall back to whatever the list endpoint gave us
        }
      }

      const liveDurationSec = stopTime
        ? durationSec
        : Math.round((Date.now() - startTime.getTime()) / 1000);

      const shouldUpdate =
        (existing.stopTime?.getTime() ?? null) !== (stopTime?.getTime() ?? null) ||
        existing.energyWh !== liveEnergyWh ||
        existing.durationSec !== liveDurationSec;

      if (shouldUpdate) {
        await db.chargingSession.update({
          where: { id: existing.id },
          data: {
            stopTime,
            durationSec: liveDurationSec,
            energyWh: liveEnergyWh,
          },
        });
        updated++;
      }
    } else {
      const user = usersByRfid.get(s.id_tag);
      if (!user) continue;

      let liveEnergyWh = energyWh;
      if (!stopTime) {
        try {
          const detail = await csmsSessionDetail(s.id);
          const energyValues = detail.meter_values
            .filter((mv) => mv.measurand === "Energy.Active.Import.Register")
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (energyValues.length > 0) {
            liveEnergyWh = Math.max(0, energyValues[0].value - detail.meter_start);
          }
        } catch {
          // ignored
        }
      }

      const liveDurationSec = stopTime
        ? durationSec
        : Math.round((Date.now() - startTime.getTime()) / 1000);

      await db.chargingSession.create({
        data: {
          csmsSessionId: s.id,
          userId: user.id,
          stationIdentity: s.station_identity,
          connectorId: s.connector_id,
          startTime,
          stopTime,
          energyWh: liveEnergyWh,
          durationSec: liveDurationSec,
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
  }

  return { synced, updated, skipped: false };
}