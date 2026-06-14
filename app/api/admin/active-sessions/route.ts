import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { csmsSessions, csmsSessionDetail } from "@/lib/csms";

export async function GET() {
  await requireAdmin();

  // Pull recent CSMS sessions (last 4h covers any reasonable active session)
  const lookback = new Date(Date.now() - 4 * 60 * 60 * 1000);
  let csmsList;
  try {
    csmsList = await csmsSessions({ from: lookback, limit: 200 });
  } catch {
    return Response.json({ sessions: [] });
  }

  // Filter to active sessions only (no stop_time)
  const activeRaw = csmsList.filter((s: any) => !s.stop_time);
  if (activeRaw.length === 0) {
    return Response.json({ sessions: [] });
  }

  // Map RFID → user for name + vehicle info
  const users = await db.user.findMany();
  const usersByRfid = new Map(users.map((u) => [u.rfidTag, u]));

  // For each active session, fetch detail to compute live energy from meterValues
  const enriched = await Promise.all(
    activeRaw.map(async (s: any) => {
      let liveEnergyWh = 0;
      try {
        const detail = await csmsSessionDetail(s.id);
        if (detail?.meterValues && detail.meterValues.length > 0) {
          const readings = detail.meterValues
            .filter((mv: any) => mv.measurand === "Energy.Active.Import.Register")
            .sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          if (readings.length > 0) {
            liveEnergyWh = Math.max(0, readings[0].value - (detail.meter_start ?? 0));
          }
        }
      } catch {
        // ignore — energy stays at 0 if detail fetch fails
      }

      const user = usersByRfid.get(s.id_tag);
      const startTime = new Date(s.start_time);
      const durationSec = Math.round((Date.now() - startTime.getTime()) / 1000);

      return {
        csmsSessionId: s.id,
        userId: user?.id ?? null,
        userName: user?.name ?? s.id_tag,
        userEmail: user?.email ?? null,
        department: user?.department ?? null,
        carMake: user?.carMake ?? null,
        carModel: user?.carModel ?? null,
        stationIdentity: s.station_identity,
        connectorId: s.connector_id,
        startTime: s.start_time,
        energyWh: liveEnergyWh,
        durationSec,
      };
    })
  );

  return Response.json({ sessions: enriched });
}