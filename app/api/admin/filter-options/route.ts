import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET() {
  await requireAdmin();

  const sessions = await db.chargingSession.findMany({
    select: {
      userId: true,
      userNameSnap: true,
      employeeIdSnap: true,
      departmentSnap: true,
      carMakeSnap: true,
      carModelSnap: true,
      carYearSnap: true,
    },
  });

  const userMap = new Map<number, { id: number; name: string; employeeId: string | null }>();
  const departments = new Set<string>();
  const makeToModels = new Map<string, Set<string>>();
  const years = new Set<number>();

  for (const s of sessions) {
    if (!userMap.has(s.userId)) {
      userMap.set(s.userId, { id: s.userId, name: s.userNameSnap, employeeId: s.employeeIdSnap });
    }
    if (s.departmentSnap) departments.add(s.departmentSnap);
    if (s.carMakeSnap) {
      const set = makeToModels.get(s.carMakeSnap) ?? new Set();
      if (s.carModelSnap) set.add(s.carModelSnap);
      makeToModels.set(s.carMakeSnap, set);
    }
    if (s.carYearSnap) years.add(s.carYearSnap);
  }

  return Response.json({
    users: [...userMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    departments: [...departments].sort(),
    makes: [...makeToModels.keys()].sort(),
    modelsByMake: Object.fromEntries([...makeToModels.entries()].map(([k, v]) => [k, [...v].sort()])),
    years: [...years].sort((a, b) => b - a),
  });
}