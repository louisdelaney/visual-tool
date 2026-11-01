// Which store and export sink to use, from the environment:
//   BACKEND=firestore   Firestore (the default when GOOGLE_CLOUD_PROJECT is set)
//   BACKEND=memory      in memory, persisted to DATA_FILE if set
//   EXPORT_DIR          the folder the export job writes to (default ./data/export), which the
//                       server serves at /export/* when no EXPORT_URL is set
// The store and the sink are independent: the emulator-backed backend in compose.yaml uses
// Firestore with a folder. Memory mode is for laptops and tests. It's refused on Cloud Run
// (K_SERVICE is set there), where a restart would silently lose everything.
import { MemoryStore } from "./db-memory";
import type { Store } from "./store";

export type Backend = "firestore" | "memory";

export function backendMode(env: NodeJS.ProcessEnv = process.env): Backend {
  const mode = env.BACKEND ?? (env.GOOGLE_CLOUD_PROJECT ? "firestore" : "memory");
  if (mode !== "firestore" && mode !== "memory") throw new Error(`BACKEND must be "firestore" or "memory", not "${mode}"`);
  if (mode === "memory" && env.K_SERVICE) throw new Error("BACKEND=memory is refused on Cloud Run: nothing would be kept");
  return mode;
}

export const EXPORT_DIR_DEFAULT = "./data/export";

/** The folder exports are written to and, locally, served from. */
export function exportDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.EXPORT_DIR ?? EXPORT_DIR_DEFAULT;
}

export async function openStore(env: NodeJS.ProcessEnv = process.env): Promise<Store> {
  if (backendMode(env) === "memory") return new MemoryStore(env.DATA_FILE);
  const { Db } = await import("./db");
  return new Db();
}
