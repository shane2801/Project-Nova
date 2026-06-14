import { csmsStations, csmsConnectors } from "@/lib/csms";

export async function GET() {
  try {
    const stations = await csmsStations();
    const withConnectors = await Promise.all(
      stations.map(async (s) => {
        const connectors = await csmsConnectors(s.identity).catch(() => []);
        return {
          identity: s.identity,
          location: s.location,
          vendor: s.vendor,
          model: s.model,
          connected: s.connected,
          connectors: connectors.map((c) => ({
            connectorId: c.connector_id,
            status: c.status,
            errorCode: c.error_code,
            updatedAt: c.updated_at,
          })),
        };
      })
    );
    return Response.json({
      stations: withConnectors,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json({ error: "CSMS unreachable" }, { status: 503 });
  }
}