// The backend API. One base URL, set at build time from VITE_API_URL:
//   POST {VITE_API_URL}/sessions                    a contributed session's JSON (schema in schema.ts)
//   GET  {VITE_API_URL}/groups?test_version=N        summary statistics for each comparison group
//   GET  {VITE_API_URL}/history?pseudonym=P          every session sent with that pseudonym
// Empty until the backend exists: nothing is sent, and no comparison is shown.
import { parseGroups, type GroupsResponse } from "./comparison";
import { normalizePseudonym, parseHistory, suggestPseudonym, type HistoryResponse } from "./history";
import type { SessionExport } from "./schema";

/** Every request: no cookies or credentials, and no referrer saying which page it came from. */
const PRIVATE: RequestInit = { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" };

export const API_URL: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** Sends a session. Resolves the id the backend stored it under, which its history and the export use. */
export async function postSession(data: SessionExport): Promise<string> {
  const r = await fetch(`${API_URL}/sessions`, { ...PRIVATE, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const id: unknown = (await r.json().catch(() => null))?.submission_id;
  if (typeof id !== "string" || !id) throw new Error("The backend didn't say what it stored the session as");
  return id;
}

export async function fetchGroups(testVersion: number, signal?: AbortSignal): Promise<GroupsResponse> {
  const r = await fetch(`${API_URL}/groups?test_version=${encodeURIComponent(testVersion)}`, { ...PRIVATE, signal: signal ?? null });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const stats = parseGroups(await r.json());
  if (!stats) throw new Error("The group statistics weren't in the expected format");
  if (stats.test_version !== testVersion) throw new Error(`Got statistics for test version ${stats.test_version}, not ${testVersion}`);
  return stats;
}

export async function fetchHistory(pseudonym: string, signal?: AbortSignal): Promise<HistoryResponse> {
  const r = await fetch(`${API_URL}/history?pseudonym=${encodeURIComponent(normalizePseudonym(pseudonym))}`, { ...PRIVATE, signal: signal ?? null });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const history = parseHistory(await r.json());
  if (!history) throw new Error("The history wasn't in the expected format");
  return history;
}

/**
 * A generated pseudonym nobody has used yet. Two people sharing one would share a history, so
 * each candidate is looked up first. Without a backend, there's nothing to check against.
 */
export async function freshPseudonym(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = suggestPseudonym();
    if (!API_URL) return candidate;
    try {
      if ((await fetchHistory(candidate)).sessions.length === 0) return candidate;
    } catch {
      return candidate; // offline or the check failed: a fresh pair is still very unlikely to be taken
    }
  }
  return suggestPseudonym();
}
