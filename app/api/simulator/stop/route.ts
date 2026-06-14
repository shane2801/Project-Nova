import { getCurrentUser } from "@/lib/session";
import { stopSimulator, getRun, toJSON } from "@/lib/simulator";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const ok = stopSimulator(id);
  if (!ok) return Response.json({ error: "Simulator not found" }, { status: 404 });

  const run = getRun(id);
  return Response.json({ ok: true, run: run ? toJSON(run) : null });
}