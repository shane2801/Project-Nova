import { spawn, type ChildProcess } from "child_process";
import path from "path";

type SimulatorRun = {
  id: string;
  process: ChildProcess;
  startedAt: Date;
  identity: string;
  tag: string;
  duration: number;
  power: number;
  interval: number;
  log: string[];
  exitedAt: Date | null;
  exitCode: number | null;
  spawnError: string | null;
};

const globalForSim = globalThis as unknown as {
  simulatorRuns?: Map<string, SimulatorRun>;
};
const runs: Map<string, SimulatorRun> =
  globalForSim.simulatorRuns ?? (globalForSim.simulatorRuns = new Map());

function resolveSimulatorCwd(): string {
  return path.resolve(
    "C:/evolve/evolve-api/slot-manager/simulator/charge-point"
  );
}
export type StartSimulatorOpts = {
  identity: string;
  tag: string;
  duration: number;
  power: number;
  interval: number;
  csms?: string;
};

export function startSimulator(opts: StartSimulatorOpts): SimulatorRun {
  const id = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cwd = resolveSimulatorCwd();

  // On Windows, `npm` is `npm.cmd`. Without shell:true, spawn won't find it.
const isWindows = process.platform === "win32";
const command = isWindows ? "npm.cmd" : "npm";
const useShell = isWindows; // required on Windows to launch .cmd files

  const args = [
    "start",
    "--",
    "--identity", opts.identity,
    "--csms", opts.csms ?? "ws://localhost:9000",
    "--tag", opts.tag,
    "--duration", String(opts.duration),
    "--power", String(opts.power),
    "--interval", String(opts.interval),
  ];

  const run: SimulatorRun = {
    id,
    process: null as any,
    startedAt: new Date(),
    identity: opts.identity,
    tag: opts.tag,
    duration: opts.duration,
    power: opts.power,
    interval: opts.interval,
    log: [`[spawn] cwd=${cwd}`, `[spawn] cmd=${command} ${args.join(" ")}`],
    exitedAt: null,
    exitCode: null,
    spawnError: null,
  };

  let child: ChildProcess;
  try {
    child = spawn(command, args, {
      cwd,
      shell: useShell,
      env: { ...process.env, FORCE_COLOR: "0" },
      windowsHide: true,
    });
  } catch (err: any) {
    run.spawnError = err.message ?? String(err);
    run.log.push(`[fatal] spawn threw: ${run.spawnError}`);
    run.exitedAt = new Date();
    run.exitCode = -1;
    runs.set(id, run);
    return run;
  }

  run.process = child;

  child.stdout?.on("data", (data) => {
    const text = data.toString();
    run.log.push(text);
    if (run.log.length > 500) run.log.shift();
  });
  child.stderr?.on("data", (data) => {
    const text = data.toString();
    run.log.push(`[stderr] ${text}`);
    if (run.log.length > 500) run.log.shift();
  });
  child.on("exit", (code, signal) => {
    run.exitedAt = new Date();
    run.exitCode = code;
    run.log.push(`[exit] code=${code} signal=${signal ?? "none"}`);
  });
  child.on("error", (err) => {
    run.log.push(`[error] ${err.message}`);
    run.spawnError = err.message;
    run.exitedAt = new Date();
    run.exitCode = -1;
  });

  runs.set(id, run);
  return run;
}

export function stopSimulator(id: string): boolean {
  const run = runs.get(id);
  if (!run) return false;
  if (run.exitedAt) return true;
  if (!run.process) return false;
  try {
    if (process.platform === "win32") {
      // SIGTERM is unreliable on Windows; use taskkill
      run.process.kill();
    } else {
      run.process.kill("SIGTERM");
      setTimeout(() => {
        if (!run.exitedAt) {
          try { run.process.kill("SIGKILL"); } catch {}
        }
      }, 5000);
    }
  } catch {
    return false;
  }
  return true;
}

export function getRun(id: string): SimulatorRun | undefined {
  return runs.get(id);
}

export function listActiveRuns(): SimulatorRun[] {
  return Array.from(runs.values()).filter((r) => !r.exitedAt);
}

// New: list runs that exited recently — keeps logs visible briefly
export function listRecentRuns(withinMs: number = 30_000): SimulatorRun[] {
  const cutoff = Date.now() - withinMs;
  return Array.from(runs.values()).filter(
    (r) => r.exitedAt && r.exitedAt.getTime() >= cutoff
  );
}

export function pruneOldRuns() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, run] of runs.entries()) {
    if (run.exitedAt && run.exitedAt.getTime() < cutoff) {
      runs.delete(id);
    }
  }
}

export function toJSON(run: SimulatorRun) {
  return {
    id: run.id,
    startedAt: run.startedAt.toISOString(),
    identity: run.identity,
    tag: run.tag,
    duration: run.duration,
    power: run.power,
    interval: run.interval,
    exitedAt: run.exitedAt?.toISOString() ?? null,
    exitCode: run.exitCode,
    running: !run.exitedAt,
    spawnError: run.spawnError,
    log: run.log.slice(-50).join(""),
  };
}