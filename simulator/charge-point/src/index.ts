/**
 * Charge Point Simulator — CLI
 *
 * Usage:
 *   npm start -- [options]
 *
 * Options:
 *   --identity  <id>       Charge point identity (default: CP001)
 *   --csms      <url>      CSMS WebSocket URL   (default: ws://localhost:9000)
 *   --tag       <rfid>     RFID tag to present  (default: RFID001)
 *   --duration  <seconds>  Charge duration      (default: 60)
 *   --power     <watts>    Simulated power      (default: 7400)
 *   --interval  <seconds>  MeterValues interval (default: 10)
 *   --meter-start <wh>     Starting meter value (default: 0)
 *
 * Examples:
 *   npm start -- --identity CP002 --tag RFID-ABC --duration 120
 *   npm start -- --csms ws://192.168.1.10:9000 --power 22000
 */

import { ChargePoint } from './ChargePoint';
import { runFullCharge } from './scenarios/full-charge';

function arg(flag: string, def: string): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : def;
}

const identity = arg('--identity',    'CP001');
const csmsUrl  = arg('--csms',        'ws://localhost:9000');
const idTag    = arg('--tag',         'RFID001');
const duration = parseInt(arg('--duration',    '60'),   10) * 1000;
const power    = parseInt(arg('--power',       '7400'), 10);
const interval = parseInt(arg('--interval',    '10'),   10) * 1000;
const start    = parseInt(arg('--meter-start', '0'),    10);

async function main(): Promise<void> {
  const cp = new ChargePoint({ identity, csmsUrl });

  console.log(`Connecting ${identity} → ${csmsUrl} …`);
  await cp.connect();
  console.log(`${identity} connected.\n`);

  await runFullCharge(cp, {
    idTag,
    durationMs: duration,
    meterStart: start,
    peakPowerW: power,
    intervalMs: interval,
  });

  await cp.disconnect();
  process.exit(0);
}

main().catch((err: Error) => {
  console.error(`[${identity}] Fatal:`, err.message);
  process.exit(1);
});
