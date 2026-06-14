import { setDevUser } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/auth-config";

export async function POST(req: Request) {
  if (isAuthEnabled()) {
    return Response.json(
      { error: "User switcher is disabled when auth is enabled" },
      { status: 403 }
    );
  }
  const { userId } = await req.json();
  if (typeof userId !== "number") {
    return Response.json({ error: "userId required" }, { status: 400 });
  }
  await setDevUser(userId);
  return Response.json({ ok: true });
}