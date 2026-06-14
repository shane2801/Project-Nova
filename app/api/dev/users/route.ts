import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      employeeId: true,
    },
    orderBy: { name: "asc" },
  });
  return Response.json(users);
}