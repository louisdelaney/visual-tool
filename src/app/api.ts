// The backend API. One base URL, set at build time from VITE_API_URL:
//   POST {VITE_API_URL}/sessions                    a contributed session's JSON (schema in schema.ts)
//   DELETE {VITE_API_URL}/sessions                  removes one, with the token its POST returned
//   GET  {VITE_API_URL}/groups                       summary statistics for each comparison group, current test only
//   GET  {VITE_API_URL}/history?pseudonym=P          every session sent with that pseudonym (at most 50)
// Empty until the backend exists: nothing is sent, and no comparison is shown.
import { parseGroups, type GroupsResponse } from "./comparison";
import { normalizePseudonym, parseHistory, suggestPseudonym, type HistoryResponse } from "./history";
import { ApiError, parseErrorId } from "./failure";
import type { SessionExport } from "./schema";

/** Every request: no cookies or credentials, and no referrer saying which page it came from. */
const PRIVATE: RequestInit = { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" };

export const API_URL: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/**
 * Sends a session. Resolves the id the backend stored it under, which its history and the export
 * use, and the token that removes it. A backend from before removal sends no token; the session is
 * still stored, so that isn't a failure (retrying would store it twice).
 */
export async function postSession(data: SessionExport): Promise<{ id: string; deleteToken: string | null }> {
  const r = await fetch(`${API_URL}/sessions`, { ...PRIVATE, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, parseErrorId(await r.json().catch(() => null)));
  const body = (await r.json().catch(() => null)) as { submission_id?: unknown; delete_token?: unknown } | null;
  const id = body?.submission_id, deleteToken = body?.delete_token;
  if (typeof id !== "string" || !id) throw new Error("The backend didn't say what it stored the session as");
  return { id, deleteToken: typeof deleteToken === "string" && deleteToken ? deleteToken : null };
}

/** Removes a sent session from the database. Only its sender has the token. */
export async function deleteSession(id: string, deleteToken: string): Promise<void> {
  const r = await fetch(`${API_URL}/sessions`, { ...PRIVATE, method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submission_id: id, delete_token: deleteToken }) });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, parseErrorId(await r.json().catch(() => null)));
}

/** The groups for the backend's current test version, which must be `testVersion` (a page built before a new version would otherwise compare across versions). */
export async function fetchGroups(testVersion: number, signal?: AbortSignal): Promise<GroupsResponse> {
  const r = await fetch(`${API_URL}/groups`, { ...PRIVATE, signal: signal ?? null });
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
