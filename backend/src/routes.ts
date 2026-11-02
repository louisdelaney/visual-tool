// The five endpoints the README documents. Each handler gets the parsed URL and the request,
// and returns what to send; the server does CORS, limits and error handling around them.
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import type { HistoryResponse } from "../../src/app/history";
import { normalizePseudonym } from "../../src/app/history";
import { TEST_VERSION } from "../../src/core/protocol";
import { hashDeleteToken, newDeleteToken, type Store } from "./store";
import { HttpError, readBody } from "./http";
import { groupsResponse } from "./stats";
import { EXPORT_FILE, runExport } from "./jobs/export";
import { historyEntry, staircasesOf } from "./summary";
import { MAX_BODY_BYTES, validateSession } from "./validate";

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
  private groupsCache: { at: number; body: unknown } | null = null;

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
    const id = await this.db.storeSession(v.session, new Date(), removal.hash);
    this.groupsCache = null;
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
    this.groupsCache = null;
    return { status: 204 };
  }

  /** Always the current test version: there is no way to ask for another. */
  async getGroups(): Promise<Reply> {
    const cached = this.groupsCache;
    const now = Date.now();
    if (cached && now - cached.at < GROUPS_CACHE_MS) return { status: 200, body: cached.body, headers: { "Cache-Control": "public, max-age=300" } };
    const body = groupsResponse(TEST_VERSION, await this.db.readGroups(TEST_VERSION));
    this.groupsCache = { at: now, body };
    return { status: 200, body, headers: { "Cache-Control": "public, max-age=300" } };
  }

  async getHistory(url: URL): Promise<Reply> {
    const p = normalizePseudonym(url.searchParams.get("pseudonym") ?? "");
    if (!p) throw new HttpError(400, "pseudonym is required");
    if (p.length > MAX_PSEUDONYM) throw new HttpError(400, "pseudonym is too long");
    const rows = await this.db.historyFor(p, MAX_HISTORY);
    // Rows stored before staircases were kept read them from the session; at most MAX_HISTORY reads.
    const sessions = await Promise.all(rows.map(async row => {
      if (row.staircases) return historyEntry(row);
      const session = await this.db.readSession(row.submission_id);
      return historyEntry(row, session ? staircasesOf(session) : null);
    }));
    const body: HistoryResponse = { pseudonym: p, sessions };
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
