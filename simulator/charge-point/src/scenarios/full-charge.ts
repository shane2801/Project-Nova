import { ChargePoint } from '../ChargePoint';

export interface FullChargeOptions {
  /** OCPP connector id (default: 1) */
  connectorId?: number;
  /** RFID tag to authorize */
  idTag: string;
  /** Total charge duration in ms (default: 60 000) */
  durationMs?: number;
  /** Starting meter reading in Wh (default: 0) */
  meterStart?: number;
  /** Simulated charge power in W (default: 7 400 — typical 32A AC) */
  peakPowerW?: number;
  /** MeterValues reporting interval in ms (default: 10 000) */
  intervalMs?: number;
}

/**
 * Runs a complete OCPP 1.6J charge cycle:
 *   Available → Authorize → Preparing → StartTransaction
 *   → [MeterValues loop] → StopTransaction → Available
 */
export async function runFullCharge(cp: ChargePoint, opts: FullChargeOptions): Promise<void> {
  const {
    connectorId = 1,
    idTag,
    durationMs  = 60_000,
    meterStart  = 0,
    peakPowerW  = 7_400,
    intervalMs  = 10_000,
  } = opts;

  const log = (msg: string) => console.log(`[${cp.identity}] ${msg}`);

  await cp.setStatus(connectorId, 'Available');
  log('Status → Available');

  log(`Authorizing tag ${idTag}…`);
  const accepted = await cp.authorize(idTag);
  if (!accepted) throw new Error(`Tag ${idTag} not authorized by CSMS`);
  log('Tag accepted');

  await cp.setStatus(connectorId, 'Preparing');
  log('Status → Preparing');

  const transactionId = await cp.startTransaction(connectorId, idTag, meterStart);
  log(`StartTransaction → id=${transactionId}`);

  await cp.setStatus(connectorId, 'Charging');
  log(`Status → Charging  (duration=${durationMs / 1000}s  power=${peakPowerW}W  interval=${intervalMs / 1000}s)`);

  // MeterValues loop — resolves when durationMs has elapsed OR a RemoteStop arrives
  let currentEnergy = meterStart;
  let stopReason    = 'Local';
  const startedAt   = Date.now();

  await new Promise<void>((resolve) => {
    // Register RemoteStopTransaction handler so the CSMS can interrupt the charge
    cp.onRemoteStop((txId) => {
      if (txId === transactionId) {
        log(`RemoteStop received (txId=${txId})`);
        stopReason = 'Remote';
        resolve();
      }
    });

    const tick = () => {
      if (Date.now() - startedAt >= durationMs) { resolve(); return; }

      const fractionHours = intervalMs / 3_600_000;
      currentEnergy = Math.round(currentEnergy + peakPowerW * fractionHours);

      cp.sendMeterValues(connectorId, transactionId, currentEnergy)
        .then(() => log(`MeterValues: ${currentEnergy} Wh`))
        .catch((e: Error) => log(`MeterValues error: ${e.message}`));

      setTimeout(tick, intervalMs);
    };
    setTimeout(tick, intervalMs);
  });

  await cp.stopTransaction(transactionId, currentEnergy, stopReason);
  log(`StopTransaction  meterStop=${currentEnergy} Wh  reason=${stopReason}`);

  await cp.setStatus(connectorId, 'Available');
  log('Status → Available — session complete');
}
