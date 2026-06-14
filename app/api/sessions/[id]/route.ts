import { csmsSessionDetail } from "@/lib/csms";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  const detail = await csmsSessionDetail(sessionId);
  if (!detail) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(detail);
}