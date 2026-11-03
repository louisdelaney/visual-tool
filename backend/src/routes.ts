// The five endpoints the README documents. Each handler gets the parsed URL and the request,
// and returns what to send; the server does CORS, limits and error handling around them.
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import type { HistoryResponse, RawHistory } from "../../src/app/history";
import { normalizePseudonym } from "../../src/app/history";
import { toHour } from "../../src/app/schema";
import { TEST_TYPES, TEST_VERSION, type TestType } from "../../src/core/protocol";
import { hashDeleteToken, newDeleteToken, type Store } from "./store";
import { HttpError, readBody } from "./http";
import { groupsResponse } from "./stats";
import { EXPORT_FILE, runExport } from "./jobs/export";
import { historyEntry } from "./summary";
import { MAX_BODY_BYTES, validateSession } from "./validate";
import { scrubSession } from "./scrub";

export interface Reply {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Bytes to pipe instead of a JSON body (a locally built export). */
  stream?: NodeJS.ReadableStream;
}

const MAX_PSEUDONYM = 60;
/** A removal request is two short strings. */
const MAX_DELETE_BYTES = 1024;
/** No pseudonym is expected to have more sessions than this; it bounds what one lookup reads. */
const MAX_HISTORY = 50;
const GROUPS_CACHE_MS = 60_000;

export class Routes {
  private readonly groupsCache = new Map<TestType, { at: number; body: unknown }>();

  constructor(private readonly db: Store, private readonly exportUrl: string, private readonly liveExport = false) {}

  async postSession(req: IncomingMessage): Promise<Reply> {
    const text = await readBody(req, MAX_BODY_BYTES);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new HttpError(400, "body is not JSON");
    }
    const v = validateSession(body);
    if (!v.ok) throw new HttpError(400, v.reason);
    const removal = newDeleteToken();
    // Stored to the hour, like everything else about when it ran.
    const id = await this.db.storeSession(scrubSession(v.session), new Date(toHour(new Date().toISOString())), removal.hash);
    this.groupsCache.clear();
    return { status: 201, body: { submission_id: id, delete_token: removal.token } };
  }

  /** Removes a session for whoever holds its token. The same 404 whether the id or the token is wrong. */
  async deleteSession(req: IncomingMessage): Promise<Reply> {
    const text = await readBody(req, MAX_DELETE_BYTES);
    let body: { submission_id?: unknown; delete_token?: unknown } | null;
    try {
      body = JSON.parse(text) as typeof body;
    } catch {
      throw new HttpError(400, "body is not JSON");
    }
    const id = body?.submission_id, token = body?.delete_token;
    if (typeof id !== "string" || !id || typeof token !== "string" || !token) throw new HttpError(400, "submission_id and delete_token are required");
    if (!(await this.db.deleteSession(id, hashDeleteToken(token)))) throw new HttpError(404, "no session with that id and token");
    this.groupsCache.clear();
    return { status: 204 };
  }

  /**
   * Always the current test version: there is no way to ask for another. `type` picks the full
   * test's groups (the default) or the quick test's, which are kept apart.
   */
  async getGroups(url: URL): Promise<Reply> {
    const asked = url.searchParams.get("type") ?? "full";
    if (!(TEST_TYPES as readonly string[]).includes(asked)) throw new HttpError(400, `type must be ${TEST_TYPES.join(" or ")}`);
    const testType = asked as TestType;
    const cached = this.groupsCache.get(testType);
    const now = Date.now();
    if (cached && now - cached.at < GROUPS_CACHE_MS) return { status: 200, body: cached.body, headers: { "Cache-Control": "public, max-age=300" } };
    const body = groupsResponse(TEST_VERSION, testType, await this.db.readGroups(TEST_VERSION, testType));
    this.groupsCache.set(testType, { at: now, body });
    return { status: 200, body, headers: { "Cache-Control": "public, max-age=300" } };
  }

  /** The pseudonym asked for, normalised; a 400 if there isn't a usable one. */
  private pseudonymOf(url: URL): string {
    const p = normalizePseudonym(url.searchParams.get("pseudonym") ?? "");
    if (!p) throw new HttpError(400, "pseudonym is required");
    if (p.length > MAX_PSEUDONYM) throw new HttpError(400, "pseudonym is too long");
    return p;
  }

  async getHistory(url: URL): Promise<Reply> {
    const p = this.pseudonymOf(url);
    const rows = await this.db.historyFor(p, MAX_HISTORY);
    const body: HistoryResponse = { pseudonym: p, sessions: rows.map(historyEntry) };
    return { status: 200, body };
  }

  /** Every session sent with a pseudonym, in full and scrubbed as the public export has it, for saving from the Results by pseudonym page. */
  async getHistorySessions(url: URL): Promise<Reply> {
    const p = this.pseudonymOf(url);
    const rows = await this.db.historyFor(p, MAX_HISTORY);
    const found = await Promise.all(rows.map(async row => {
      const session = await this.db.readSession(row.submission_id);
      return session ? [{ ...scrubSession(session), submission_id: row.submission_id }] : [];
    }));
    const body: RawHistory = { pseudonym: p, sessions: found.flat() };
    return { status: 200, body };
  }

  async getExport(): Promise<Reply> {
    if (this.exportUrl) return { status: 302, headers: { Location: this.exportUrl, "Cache-Control": "public, max-age=3600" } };
    if (!this.liveExport) throw new HttpError(404, "no export is configured");
    // A local copy: the same file the nightly job publishes, built from the store now.
    let gz: Buffer = Buffer.alloc(0);
    await runExport(this.db, { async write(_name, data) { gz = data; } });
    const headers = { "Content-Type": "application/json", "Content-Encoding": "gzip", "Content-Disposition": `attachment; filename="${EXPORT_FILE}"`, "Content-Length": String(gz.length), "Cache-Control": "no-store" };
    return { status: 200, headers, stream: Readable.from([gz]) };
  }
}
