import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET() {
  await requireAdmin();
  const users = await db.user.findMany({
    select: { department: true },
    where: { department: { not: null } },
    distinct: ["department"],
  });
  const departments = users.map((u) => u.department).filter(Boolean).sort();
  return Response.json(departments);
}