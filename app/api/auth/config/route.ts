import { isAuthEnabled } from "@/lib/auth-config";

export async function GET() {
  return Response.json({ authEnabled: isAuthEnabled() });
}