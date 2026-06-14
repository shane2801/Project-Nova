import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    name,
    email,
    password,
    department,
    jobTitle,
    employeeId,
    joinedAt,
    carMake,
    carModel,
    carYear,
    carPlate,
    privacyAck,
  } = body;

  if (!name || !email || !password) {
    return Response.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!privacyAck) {
    return Response.json({ error: "Privacy acknowledgement is required" }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return Response.json({ error: "Email is already registered" }, { status: 409 });
  }

  const count = await db.user.count();
  const rfidTag = `RFID-EMP-${String(count + 1).padStart(4, "0")}`;
  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      rfidTag,
      role: "user",
      department: department || null,
      jobTitle: jobTitle || null,
      employeeId: employeeId || null,
      joinedAt: joinedAt ? new Date(joinedAt) : null,
      privacyAckAt: new Date(),
      carMake: carMake || null,
      carModel: carModel || null,
      carYear: carYear ? parseInt(String(carYear), 10) : null,
      carPlate: carPlate || null,
    },
  });

  await setSessionCookie(user.id);
  return Response.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
}