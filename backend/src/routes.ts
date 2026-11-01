// The four endpoints the README documents. Each handler gets the parsed URL and the request,
// and returns what to send; the server does CORS, limits and error handling around them.
import type { IncomingMessage } from "node:http";
import type { HistoryResponse } from "../../src/app/history";
import { normalizePseudonym } from "../../src/app/history";
import { TEST_VERSION } from "../../src/core/protocol";
import type { Store } from "./store";
import { HttpError, readBody } from "./http";
import { groupsResponse } from "./stats";
import { historyEntry } from "./summary";
import { MAX_BODY_BYTES, validateSession } from "./validate";

export interface Reply {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** A file to pipe instead of a body (memory mode's export files). */
  stream?: NodeJS.ReadableStream;
}

const MAX_PSEUDONYM = 60;
/** No pseudonym is expected to have more sessions than this; it bounds what one lookup reads. */
const MAX_HISTORY = 50;
const GROUPS_CACHE_MS = 60_000;

export class Routes {
  private groupsCache: { at: number; body: unknown } | null = null;

  constructor(private readonly db: Store, private readonly exportUrl: string) {}

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
    const id = await this.db.storeSession(v.session);
    this.groupsCache = null;
    return { status: 201, body: { submission_id: id } };
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
    const body: HistoryResponse = { pseudonym: p, sessions: rows.map(historyEntry) };
    return { status: 200, body };
  }

  getExport(): Reply {
    if (!this.exportUrl) throw new HttpError(404, "no export is configured");
    return { status: 302, headers: { Location: this.exportUrl, "Cache-Control": "public, max-age=3600" } };
  }
}
