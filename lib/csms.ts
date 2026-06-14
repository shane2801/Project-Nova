const CSMS_BASE = process.env.CSMS_BASE_URL ?? "http://localhost:3000/api";

type Station = {
  id: number;
  identity: string;
  vendor: string;
  model: string;
  location: string | null;
  last_seen: string;
  connected: boolean;
};

type Connector = {
  connector_id: number;
  status: string;
  error_code: string;
  updated_at: string;
};

type Session = {
  id: number;
  transaction_id: number;
  station_identity: string;
  connector_id: number;
  id_tag: string;
  start_time: string;
  stop_time: string | null;
  meter_start: number;
  meter_stop: number | null;
  energy_wh: number | null;
  stop_reason: string | null;
  status: "Active" | "Completed";
};


type MeterValue = {
  id: number;
  session_id: number;
  station_identity: string;
  connector_id: number;
  timestamp: string;
  measurand: string;
  value: number;
  unit: string;
};

type SessionDetail = Session & {
  meterValues: MeterValue[];
};

export async function csmsSessionDetail(sessionId: number): Promise<SessionDetail | null> {
  const res = await fetch(`${CSMS_BASE}/sessions/${sessionId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`CSMS sessions/${sessionId} failed: ${res.status}`);
  return res.json();
}

export async function csmsStations(): Promise<Station[]> {
  const res = await fetch(`${CSMS_BASE}/stations`, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSMS stations failed: ${res.status}`);
  return res.json();
}

export async function csmsConnectors(identity: string): Promise<Connector[]> {
  const res = await fetch(`${CSMS_BASE}/stations/${identity}/connectors`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CSMS connectors failed: ${res.status}`);
  return res.json();
}

export async function csmsAuthorizeTag(input: {
  idTag: string;
  validFrom: Date;
  validTo: Date;
  stationIdentity?: string;
}) {
  const res = await fetch(`${CSMS_BASE}/auth/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idTag: input.idTag,
      validFrom: input.validFrom.toISOString(),
      validTo: input.validTo.toISOString(),
      stationIdentity: input.stationIdentity,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CSMS auth/tags failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function csmsRevokeTag(idTag: string) {
  const res = await fetch(`${CSMS_BASE}/auth/tags/${idTag}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`CSMS revoke failed: ${res.status}`);
  }
}

export async function csmsSessions(params: {
  idTag?: string;
  station?: string;
  status?: "Active" | "Completed";
  from?: Date;
  to?: Date;
}): Promise<Session[]> {
  const qs = new URLSearchParams();
  if (params.idTag) qs.set("idTag", params.idTag);
  if (params.station) qs.set("station", params.station);
  if (params.status) qs.set("status", params.status);
  if (params.from) qs.set("from", params.from.toISOString());
  if (params.to) qs.set("to", params.to.toISOString());
  const res = await fetch(`${CSMS_BASE}/sessions?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CSMS sessions failed: ${res.status}`);
  return res.json();
}

export async function csmsRemoteStop(identity: string, transactionId: number) {
  const res = await fetch(`${CSMS_BASE}/stations/${identity}/remote-stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId }),
  });
  if (!res.ok) throw new Error(`CSMS remote-stop failed: ${res.status}`);
  return res.json();
}