import { csmsSessions } from "@/lib/csms";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idTag = url.searchParams.get("idTag") ?? undefined;
  const status = url.searchParams.get("status") as "Active" | "Completed" | null;
  const sessions = await csmsSessions({
    idTag,
    status: status ?? undefined,
  });
  return Response.json(sessions);
}