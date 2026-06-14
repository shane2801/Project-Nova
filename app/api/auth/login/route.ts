import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !user.passwordHash) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return Response.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}