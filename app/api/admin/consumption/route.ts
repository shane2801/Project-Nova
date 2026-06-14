import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { dateRange, type RangeKey } from "@/lib/date-ranges";
import { syncSessionsFromCsms } from "@/lib/session-sync";

export async function GET(req: Request) {
  await requireAdmin();

  // Opportunistic sync — picks up any new real sessions before we query
  await syncSessionsFromCsms().catch(() => null);

  const url = new URL(req.url);
  const range = (url.searchParams.get("range") ?? "month") as RangeKey;
  const userId = url.searchParams.get("userId");
  const department = url.searchParams.get("department");
  const carMake = url.searchParams.get("carMake");
  const carModel = url.searchParams.get("carModel");
  const yearMin = url.searchParams.get("yearMin");
  const yearMax = url.searchParams.get("yearMax");

  const { from, to } = dateRange(range);

  const where: any = {};
  if (from) where.startTime = { gte: from };
  if (to) where.startTime = { ...(where.startTime ?? {}), lte: to };
  if (userId) where.userId = parseInt(userId, 10);
  if (department) where.departmentSnap = department;
  if (carMake) where.carMakeSnap = carMake;
  if (carModel) where.carModelSnap = carModel;
  if (yearMin || yearMax) {
    where.carYearSnap = {};
    if (yearMin) where.carYearSnap.gte = parseInt(yearMin, 10);
    if (yearMax) where.carYearSnap.lte = parseInt(yearMax, 10);
  }

  const sessions = await db.chargingSession.findMany({ where, orderBy: { startTime: "asc" } });

  // Totals
  const totalEnergyWh = sessions.reduce((a, s) => a + s.energyWh, 0);
  const totalSessions = sessions.length;
  const uniqueUsers = new Set(sessions.map((s) => s.userId)).size;
  const totalDurationSec = sessions.reduce((a, s) => a + s.durationSec, 0);

  // Sustainability + cost
  // Mauritius grid intensity ~0.83 kgCO2/kWh, but EV replaces a petrol car (~2.3 kgCO2/L, ~7L/100km, ~6 km/kWh)
  // Net CO2 saved ≈ kWh × 0.66
  const totalKwh = totalEnergyWh / 1000;
  const co2SavedKg = totalKwh * 0.66;
  const costMur = totalKwh * 9.5; // ~9.5 MUR / kWh approx

  // By user
  const byUserMap = new Map<number, any>();
  for (const s of sessions) {
    const e = byUserMap.get(s.userId) ?? {
      userId: s.userId,
      name: s.userNameSnap,
      department: s.departmentSnap,
      jobTitle: s.jobTitleSnap,
      employeeId: s.employeeIdSnap,
      carMake: s.carMakeSnap,
      carModel: s.carModelSnap,
      energyWh: 0,
      sessions: 0,
    };
    e.energyWh += s.energyWh;
    e.sessions += 1;
    byUserMap.set(s.userId, e);
  }
  const byUser = [...byUserMap.values()].sort((a, b) => b.energyWh - a.energyWh);

  // By department
  const byDeptMap = new Map<string, any>();
  for (const s of sessions) {
    const dept = s.departmentSnap ?? "Unassigned";
    const e = byDeptMap.get(dept) ?? { department: dept, energyWh: 0, sessions: 0, users: new Set<number>() };
    e.energyWh += s.energyWh;
    e.sessions += 1;
    e.users.add(s.userId);
    byDeptMap.set(dept, e);
  }
  const byDepartment = [...byDeptMap.values()]
    .map((e) => ({ department: e.department, energyWh: e.energyWh, sessions: e.sessions, users: e.users.size }))
    .sort((a, b) => b.energyWh - a.energyWh);

  // By car make
  const byMakeMap = new Map<string, any>();
  for (const s of sessions) {
    if (!s.carMakeSnap) continue;
    const e = byMakeMap.get(s.carMakeSnap) ?? { make: s.carMakeSnap, energyWh: 0, sessions: 0 };
    e.energyWh += s.energyWh;
    e.sessions += 1;
    byMakeMap.set(s.carMakeSnap, e);
  }
  const byMake = [...byMakeMap.values()].sort((a, b) => b.energyWh - a.energyWh);

  // By day
  const byDayMap = new Map<string, number>();
  for (const s of sessions) {
    const day = s.startTime.toISOString().slice(0, 10);
    byDayMap.set(day, (byDayMap.get(day) ?? 0) + s.energyWh);
  }
  const byDay = [...byDayMap.entries()]
    .map(([date, energyWh]) => ({ date, energyWh }))
    .sort((a, b) => a.date.localeCompare(b.date));


  // Energy by car make per day — multi-line chart
  const byMakeByDayMap = new Map<string, Map<string, number>>(); // make -> date -> Wh
  for (const s of sessions) {
    if (!s.carMakeSnap) continue;
    const dayKey = s.startTime.toISOString().slice(0, 10);
    if (!byMakeByDayMap.has(s.carMakeSnap)) byMakeByDayMap.set(s.carMakeSnap, new Map());
    const dayMap = byMakeByDayMap.get(s.carMakeSnap)!;
    dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + s.energyWh);
  }
  const allDates = byDay.map((d) => d.date);
  const byMakeOverTime = [...byMakeByDayMap.entries()].map(([make, dayMap]) => ({
    make,
    data: allDates.map((date) => ({ date, energyWh: dayMap.get(date) ?? 0 })),
  }));
  // Peak hours heatmap — hour of day × day of week
  const heatmap: Record<string, number> = {};
  for (const s of sessions) {
    const d = new Date(s.startTime);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip Sun + Sat
    const hour = d.getHours();
    const key = `${dow}-${hour}`;
    heatmap[key] = (heatmap[key] ?? 0) + 1;
  }

  // By station utilization
  const byStationMap = new Map<string, any>();
  for (const s of sessions) {
    const e = byStationMap.get(s.stationIdentity) ?? {
      stationIdentity: s.stationIdentity,
      sessions: 0,
      energyWh: 0,
      occupiedSec: 0,
    };
    e.sessions += 1;
    e.energyWh += s.energyWh;
    e.occupiedSec += s.durationSec;
    byStationMap.set(s.stationIdentity, e);
  }
  const byStation = [...byStationMap.values()].sort((a, b) => b.sessions - a.sessions);

  return Response.json({
    range,
    totals: {
      energyWh: totalEnergyWh,
      sessions: totalSessions,
      users: uniqueUsers,
      durationSec: totalDurationSec,
      co2SavedKg,
      costMur,
    },
    byUser,
    byDepartment,
    byMake,
    byDay,
    byMakeOverTime,
    byStation,
    heatmap,
  });
}