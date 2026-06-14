import { listActiveRuns, listRecentRuns, toJSON, pruneOldRuns, getRun } from "@/lib/simulator";

export async function GET(req: Request) {
  pruneOldRuns();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const run = getRun(id);
    if (!run) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(toJSON(run));
  }
  return Response.json({
    active: listActiveRuns().map(toJSON),
    recent: listRecentRuns().map(toJSON),
  });
}