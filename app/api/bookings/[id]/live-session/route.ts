import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csmsSessions, csmsSessionDetail } from "@/lib/csms";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json(null);

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== user.id) return Response.json(null);

  // Resolve which CSMS session belongs to this booking
  let sessionId = booking.simulatedSessionId;
  if (!sessionId && booking.simulatedAt) {
    const candidates = await csmsSessions({
      idTag: user.rfidTag,
      from: booking.simulatedAt,
    });
    const candidate = candidates
      .filter((s) => s.station_identity === booking.stationIdentity)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];
    if (candidate) {
      sessionId = candidate.id;
      await db.booking.update({
        where: { id: bookingId },
        data: { simulatedSessionId: candidate.id },
      });
    }
  }

  if (!sessionId) return Response.json(null);

  // Fetch the full session detail (includes meterValues)
  const detail = await csmsSessionDetail(sessionId).catch(() => null);
  if (!detail) return Response.json(null);

  // Compute live energy from latest meter value if the session is still active
  let liveEnergyWh = detail.energy_wh;
  if (detail.status === "Active" && detail.meterValues && detail.meterValues.length > 0) {
    const energyReadings = detail.meterValues.filter(
      (mv) => mv.measurand === "Energy.Active.Import.Register"
    );
    if (energyReadings.length > 0) {
      const latest = energyReadings[energyReadings.length - 1];
      // Cumulative reading minus the meter_start gives session-so-far energy
      liveEnergyWh = latest.value - (detail.meter_start ?? 0);
    }
  }

  return Response.json({
    id: detail.id,
    status: detail.status,
    start_time: detail.start_time,
    stop_time: detail.stop_time,
    energy_wh: liveEnergyWh,
    station_identity: detail.station_identity,
    connector_id: detail.connector_id,
  });
}