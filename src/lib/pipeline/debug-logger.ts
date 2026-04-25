import { appendFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync, appendFileSync } from "fs";

// ── Config ─────────────────────────────────────────

const DEBUG_DIR = ".debug";
const ENABLED = true;

// ── Helpers ────────────────────────────────────────

function truncate(obj: unknown, maxLen = 200): unknown {
  if (typeof obj === "string") {
    return obj.length > maxLen ? obj.substring(0, maxLen) + "..." : obj;
  }
  if (obj instanceof Error) {
    return { message: obj.message, stack: obj.stack?.split("\n").slice(0, 3).join("|") };
  }
  if (Buffer.isBuffer(obj)) {
    return `<Buffer ${obj.length} bytes>`;
  }
  if (obj && typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      truncate(v, maxLen),
    ]);
    return Object.fromEntries(entries);
  }
  return obj;
}

// ── Logger principal ───────────────────────────────

let logFile: string | null = null;

async function ensureLogFile(): Promise<string> {
  if (logFile) return logFile;
  ensureLogFileSync();
  return logFile!;
}

function ensureLogFileSync(): string {
  if (logFile) return logFile;

  if (!existsSync(DEBUG_DIR)) {
    mkdirSync(DEBUG_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  logFile = path.join(DEBUG_DIR, `pipeline-${timestamp}.jsonl`);
  return logFile;
}

export interface DebugEntry {
  ts: string;
  delta: number | null;
  fn: string;
  event: "enter" | "exit" | "error" | "log" | "http_request" | "http_response";
  data?: unknown;
}

let lastTs = Date.now();

async function writeEntry(entry: DebugEntry): Promise<void> {
  if (!ENABLED) return;

  try {
    const file = await ensureLogFile();
    const line = JSON.stringify(entry) + "\n";
    await appendFile(file, line, "utf-8");
  } catch {
    // Silently fail — debug logging should never crash the app
  }
}

// ── API pública ────────────────────────────────────

export async function log(
  fn: string,
  event: DebugEntry["event"],
  data?: unknown
): Promise<void> {
  const now = Date.now();
  await writeEntry({
    ts: new Date(now).toISOString(),
    delta: lastTs ? now - lastTs : null,
    fn,
    event,
    data: data !== undefined ? truncate(data) : undefined,
  });
  lastTs = now;
}

/** Versão síncrona — garante que o log é escrito ANTES de qualquer throw */
export function logSync(
  fn: string,
  event: DebugEntry["event"],
  data?: unknown
): void {
  if (!ENABLED) return;
  try {
    const file = ensureLogFileSync();
    const now = Date.now();
    const entry: DebugEntry = {
      ts: new Date(now).toISOString(),
      delta: lastTs ? now - lastTs : null,
      fn,
      event,
      data: data !== undefined ? truncate(data) : undefined,
    };
    lastTs = now;
    const line = JSON.stringify(entry) + "\n";
    appendFileSync(file, line, "utf-8");
  } catch {
    // Silently fail — debug logging should never crash the app
  }
}

export async function enter(fn: string, args?: unknown): Promise<void> {
  await log(fn, "enter", args);
}

export async function exit(fn: string, result?: unknown): Promise<void> {
  await log(fn, "exit", result);
}

export async function error(
  fn: string,
  err: unknown,
  context?: unknown
): Promise<void> {
  await log(fn, "error", { error: err, context });
}

/** Versão síncrona de error() — para usar em contextos síncronos (validações) */
export function errorSync(
  fn: string,
  err: unknown,
  context?: unknown
): void {
  logSync(fn, "error", { error: err, context });
}

export async function httpRequest(
  fn: string,
  method: string,
  url: string,
  body?: unknown
): Promise<void> {
  await log(fn, "http_request", { method, url, body });
}

export async function httpResponse(
  fn: string,
  method: string,
  url: string,
  status: number,
  body?: unknown
): Promise<void> {
  await log(fn, "http_response", { method, url, status, body: truncate(body, 100) });
}

/** Envolve uma função async com logging automático de enter/exit/error */
export function traced<T extends (...args: never[]) => Promise<unknown>>(
  label: string,
  fn: T
): T {
  return (async (...args: never[]) => {
    await enter(label, args.length > 0 ? args : undefined);
    try {
      const result = await fn(...args);
      await exit(label, result !== undefined ? result : undefined);
      return result;
    } catch (err) {
      await error(label, err);
      throw err;
    }
  }) as unknown as T;
}
