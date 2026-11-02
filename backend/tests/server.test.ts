import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MIN_GROUP, parseGroups } from "../../src/app/comparison";
import { parseHistory } from "../../src/app/history";
import { TEST_VERSION } from "../../src/core/protocol";
import { MemoryStore } from "../src/db-memory";
import type { SummaryRow } from "../src/summary";
import { createApp, type ServerOptions } from "../src/server";
import { makeSession, withThresholds } from "./fixture";

const ORIGIN = "https://site.example";
const EXPORT_URL = "https://github.com/owner/visual-tool/releases/download/data/visual-data.json.gz";

const servers: Server[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(servers.splice(0).map(s => new Promise(resolve => { s.closeAllConnections(); s.close(resolve); })));
});

/** A store whose storeSession fails, for the 500. */
const failingStore = (): MemoryStore => {
  const store = new MemoryStore();
  store.storeSession = async () => { throw new Error("firestore is down"); };
  return store;
};

async function start(db = new MemoryStore(), options: Partial<ServerOptions> = {}) {
  const handle = createApp({ allowedOrigin: ORIGIN, exportUrl: EXPORT_URL, db, ...options });
  const server = createServer((req, res) => void handle(req, res));
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { db, base };
}

const post = (base: string, body: unknown, init: RequestInit = {}) =>
  fetch(`${base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body), ...init });

describe("POST /sessions", () => {
  it("stores a valid session and returns 201 with a submission id", async () => {
    const { base, db } = await start();
    const res = await post(base, makeSession());
    expect(res.status).toBe(201);
    const body = (await res.json()) as { submission_id: string };
    expect(body.submission_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(db.size).toBe(1);
  });

  it("returns 400 for invalid JSON", async () => {
    const { base, db } = await start();
    const res = await post(base, "{not json");
    expect(res.status).toBe(400);
    expect(db.size).toBe(0);
  });

  it("returns 400, with the reason, for a session that fails validation", async () => {
    const { base, db } = await start();
    const res = await post(base, makeSession({ test_version: TEST_VERSION + 1 }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/test_version/);
    expect(db.size).toBe(0);
  });

  it("returns 413 for a body over the limit", async () => {
    const { base, db } = await start();
    const res = await post(base, "x".repeat(300_000));
    expect(res.status).toBe(413);
    expect(db.size).toBe(0);
  });

  it("returns 413 for an oversize chunked body, which the client can read", async () => {
    const { base, db } = await start();
    // No Content-Length: the server only finds out it's too big while reading.
    const chunks = Array.from({ length: 5 }, () => new Uint8Array(64 * 1024).fill(97));
    const body = new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(ch); c.close(); } });
    const res = await fetch(`${base}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body, duplex: "half" } as RequestInit);
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "body too large", id: expect.any(String) });
    expect(db.size).toBe(0);
  });

  it("returns 429 once the POST rate limit is used up", async () => {
    const { base } = await start(new MemoryStore(), { postsPerMinute: 2 });
    expect((await post(base, makeSession())).status).toBe(201);
    expect((await post(base, makeSession())).status).toBe(201);
    expect((await post(base, makeSession())).status).toBe(429);
  });

  it("returns 500 with a plain error when storing fails", async () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true); // the error is logged; keep the test output clean
    const { base } = await start(failingStore());
    const res = await post(base, makeSession());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal error", id: expect.any(String) });
  });
});

/** Stores this many control sessions, each with its own thresholds. */
const storeControls = async (db: MemoryStore, count: number) => {
  for (let i = 0; i < count; i++) await db.storeSession(withThresholds(5 + i, 10 + i));
};

const remove = (base: string, body: unknown) =>
  fetch(`${base}/sessions`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("DELETE /sessions", () => {
  it("removes a session with the token its POST returned, once", async () => {
    const { base, db } = await start();
    const sent = (await (await post(base, makeSession())).json()) as { submission_id: string; delete_token: string };
    expect(sent.delete_token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const res = await remove(base, sent);
    expect(res.status).toBe(204);
    expect(db.size).toBe(0);
    expect((await remove(base, sent)).status).toBe(404);
  });

  it("returns 404 for a wrong token and keeps the session", async () => {
    const { base, db } = await start();
    const sent = (await (await post(base, makeSession())).json()) as { submission_id: string };
    expect((await remove(base, { submission_id: sent.submission_id, delete_token: "guess" })).status).toBe(404);
    expect(db.size).toBe(1);
  });

  it("returns 400 without both fields", async () => {
    const { base } = await start();
    expect((await remove(base, { submission_id: "x" })).status).toBe(400);
  });

  it("takes the session out of GET /groups straight away", async () => {
    const { base } = await start();
    const sent: { submission_id: string; delete_token: string }[] = [];
    for (let i = 0; i < MIN_GROUP; i++) sent.push((await (await post(base, withThresholds(10 + i, 20))).json()) as (typeof sent)[number]);
    expect((await (await fetch(`${base}/groups`)).json() as { groups: { control: { n: number } } }).groups.control.n).toBe(MIN_GROUP);
    await remove(base, sent[0]);
    expect((await (await fetch(`${base}/groups`)).json() as { groups: { control: { n: number } } }).groups.control.n).toBe(MIN_GROUP - 1);
  });
});

describe("GET /groups", () => {
  it("returns group statistics the page accepts, cacheable for five minutes", async () => {
    const db = new MemoryStore();
    await storeControls(db, 30);
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    const res = await fetch(`${base}/groups`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    const parsed = parseGroups(await res.json());
    expect(parsed).not.toBeNull();
    expect(parsed!.groups.control.n).toBe(30);
    expect(parsed!.groups.control.measures).not.toBeNull();
    expect(parsed!.groups.psychedelics).toEqual({ n: 0, measures: null });
    expect(spy).toHaveBeenCalledWith(TEST_VERSION);
  });

  it("always answers for the current test version, whatever the query asks for", async () => {
    const db = new MemoryStore();
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    const res = await fetch(`${base}/groups?test_version=99`);
    expect(res.status).toBe(200);
    expect(parseGroups(await res.json())!.test_version).toBe(TEST_VERSION);
    expect(spy).toHaveBeenCalledWith(TEST_VERSION);
  });

  it("reads the store once for repeated requests", async () => {
    const db = new MemoryStore();
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    await fetch(`${base}/groups`);
    await fetch(`${base}/groups`);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("drops the cached statistics when a session for that version is stored", async () => {
    const db = new MemoryStore();
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    await fetch(`${base}/groups`);
    await post(base, makeSession());
    await fetch(`${base}/groups`);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it(`shows a posted session in the groups: hidden below ${MIN_GROUP}, summarised at ${MIN_GROUP}`, async () => {
    const db = new MemoryStore();
    await storeControls(db, MIN_GROUP - 1);
    const { base } = await start(db);
    const groups = async () => parseGroups(await (await fetch(`${base}/groups`)).json())!.groups;

    expect((await groups()).control).toEqual({ n: MIN_GROUP - 1, measures: null });
    expect((await post(base, withThresholds(40, 50))).status).toBe(201);
    const control = (await groups()).control;
    expect(control.n).toBe(MIN_GROUP);
    expect(control.measures).not.toBeNull();
  });
});

describe("GET /history", () => {
  it("looks up the normalised pseudonym and returns entries the page accepts", async () => {
    const db = new MemoryStore();
    const a = await db.storeSession(withThresholds(14.2, 31.5, { started_at: "2026-10-18T19:30:00.000Z", finished_at: "2026-10-18T19:40:00.000Z" }));
    const b = await db.storeSession(withThresholds(10.2, 21, { started_at: "2026-10-19T19:30:00.000Z", finished_at: "2026-10-19T19:40:00.000Z" }));
    await db.storeSession(withThresholds(9, 18, { answers: { pseudonym: "Someone Else" } }));
    const { base } = await start(db);
    const res = await fetch(`${base}/history?pseudonym=%20QUIET%20%20Heron`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = parseHistory(body);
    expect(parsed).not.toBeNull();
    expect(parsed!.pseudonym).toBe("quiet heron");
    expect(parsed!.sessions.map(s => s.submission_id)).toEqual([a, b]);
    expect(parsed!.sessions[0]!.values.motion_threshold_pct).toBe(14.2);
    // Only what the page needs: no pseudonym or answers on the rows.
    expect(Object.keys((body as { sessions: object[] }).sessions[0]!)).not.toContain("pseudonym");
  });

  it("returns staircases, reading them from the stored session for rows kept without them", async () => {
    const db = new MemoryStore();
    const id = await db.storeSession(withThresholds(10, 20));
    const fresh = parseHistory(await (await fetch(`${(await start(db)).base}/history?pseudonym=quiet%20heron`)).json())!.sessions[0]!;
    expect(fresh.staircases?.motion.length).toBeGreaterThan(0);
    // A row stored before staircases were kept.
    const rows = (db as unknown as { summaries: Map<string, Partial<SummaryRow>> }).summaries;
    delete rows.get(id)!.staircases;
    const old = parseHistory(await (await fetch(`${(await start(db)).base}/history?pseudonym=quiet%20heron`)).json())!.sessions[0]!;
    expect(old.staircases).toEqual(fresh.staircases);
  });

  it("returns at most 50 sessions", async () => {
    const db = new MemoryStore();
    for (let i = 0; i < 55; i++) await db.storeSession(withThresholds(10, 20));
    const { base } = await start(db);
    const parsed = parseHistory(await (await fetch(`${base}/history?pseudonym=quiet%20heron`)).json());
    expect(parsed!.sessions).toHaveLength(50);
  });

  it("has its own limit, separate from the other GETs", async () => {
    const { base } = await start(new MemoryStore(), { historyPerMinute: 1 });
    expect((await fetch(`${base}/history?pseudonym=quiet%20heron`)).status).toBe(200);
    expect((await fetch(`${base}/history?pseudonym=quiet%20heron`)).status).toBe(429);
    expect((await fetch(`${base}/groups`)).status).toBe(200);
  });

  it("returns an empty list for a pseudonym nobody has used", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/history?pseudonym=never-used`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ pseudonym: "never-used", sessions: [] });
  });

  it("returns 400 for a missing, blank or over-long pseudonym", async () => {
    const { base } = await start();
    for (const query of ["", "?pseudonym=", "?pseudonym=%20%20", `?pseudonym=${"p".repeat(61)}`]) {
      expect((await fetch(`${base}/history${query}`)).status, query).toBe(400);
    }
  });
});

describe("GET /export", () => {
  it("redirects to the export URL when one is set", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/export`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(EXPORT_URL);
  });

  it("returns 404 when none is set and the export isn't built locally", async () => {
    const { base } = await start(new MemoryStore(), { exportUrl: "" });
    const res = await fetch(`${base}/export`, { redirect: "manual" });
    expect(res.status).toBe(404);
  });

  it("builds the file from the store when local, gzip-encoded as a download, which fetch unpacks", async () => {
    const db = new MemoryStore();
    await db.storeSession(makeSession({ seed: 1 }), new Date("2026-09-15T10:00:00Z"));
    await db.storeSession(makeSession({ seed: 2 }), new Date("2026-10-15T10:00:00Z"));
    const { base } = await start(db, { exportUrl: "", liveExport: true });
    const res = await fetch(`${base}/export`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-encoding")).toBe("gzip");
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="visual-data.json"');
    const file = (await res.json()) as { total_sessions: number; sessions: { seed: number }[] };
    expect(file.total_sessions).toBe(2);
    expect(file.sessions.map(s => s.seed)).toEqual([1, 2]);
  });

  it("prefers the export URL even when local building is allowed", async () => {
    const { base } = await start(new MemoryStore(), { liveExport: true });
    expect((await fetch(`${base}/export`, { redirect: "manual" })).status).toBe(302);
  });
});

describe("CORS", () => {
  it("answers a preflight from the allowed origin with 204 and the allow headers", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/sessions`, { method: "OPTIONS", headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" } });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    expect(res.headers.get("access-control-allow-methods")).toContain("DELETE");
    expect(res.headers.get("access-control-allow-headers")).toContain("Content-Type");
  });

  it("refuses another origin with 403", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/groups`, { headers: { Origin: "https://evil.example" } });
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("refuses a preflight from another origin", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/sessions`, { method: "OPTIONS", headers: { Origin: "https://evil.example" } });
    expect(res.status).toBe(403);
  });

  it("serves a request with no Origin, without CORS headers", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/groups`);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows each of several comma-separated origins, and no other", async () => {
    const other = "http://localhost:5180";
    const { base } = await start(undefined, { allowedOrigin: `${ORIGIN}, ${other}` });
    for (const origin of [ORIGIN, other]) {
      const res = await fetch(`${base}/groups`, { headers: { Origin: origin } });
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe(origin);
    }
    expect((await fetch(`${base}/groups`, { headers: { Origin: "http://localhost:5181" } })).status).toBe(403);
  });

  it("adds the CORS header to responses for the allowed origin", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/groups`, { headers: { Origin: ORIGIN } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(res.headers.get("vary")).toBe("Origin");
  });
});

describe("other requests", () => {
  it("returns 404 for an unknown path", async () => {
    const { base } = await start();
    expect((await fetch(`${base}/nothing`)).status).toBe(404);
  });

  it("returns 404 for a method the path doesn't take", async () => {
    const { base } = await start();
    expect((await fetch(`${base}/sessions`)).status).toBe(404);
    expect((await fetch(`${base}/groups`, { method: "POST" })).status).toBe(404);
  });

  it("answers /healthz without touching the database", async () => {
    const db = new MemoryStore();
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    const res = await fetch(`${base}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns 429 for GETs once their limit is used up", async () => {
    const { base } = await start(new MemoryStore(), { getsPerMinute: 1 });
    expect((await fetch(`${base}/groups`)).status).toBe(200);
    expect((await fetch(`${base}/groups`)).status).toBe(429);
  });
});

describe("request log", () => {
  /** Captures what the server writes to stderr and returns the "request" lines as parsed. */
  const capture = () => {
    const out: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation(chunk => { out.push(String(chunk)); return true; });
    return {
      out,
      lines: () => out.flatMap(text => text.split("\n").filter(Boolean)).map(l => JSON.parse(l) as Record<string, unknown>).filter(l => l.message === "request"),
    };
  };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  it("logs a fast success too, with only the method, route, status, time and a random id", async () => {
    const log = capture();
    const { base } = await start();
    expect((await fetch(`${base}/healthz`, { headers: { "User-Agent": "SecretAgent/9", "X-Forwarded-For": "203.0.113.7" } })).status).toBe(200);
    await vi.waitFor(() => expect(log.lines()).toHaveLength(1));
    const [line] = log.lines();
    expect(Object.keys(line!).sort()).toEqual(["id", "message", "method", "ms", "route", "severity", "status"]);
    expect(line).toMatchObject({ severity: "INFO", message: "request", method: "GET", route: "/healthz", status: 200 });
    expect(line!.id).toMatch(UUID);
    expect(typeof line!.ms).toBe("number");
    expect(log.out.join("")).not.toMatch(/SecretAgent|203\.0\.113\.7/);
  });

  it("logs an unknown path as unmatched, never the path, and returns the same id in the body", async () => {
    const log = capture();
    const { base } = await start();
    const res = await fetch(`${base}/quiet-heron/secret-page?pseudonym=quiet%20heron`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string; id: string };
    await vi.waitFor(() => expect(log.lines()).toHaveLength(1));
    const [line] = log.lines();
    expect(line).toMatchObject({ severity: "WARNING", message: "request", method: "GET", route: "unmatched", status: 404, id: body.id });
    expect(body).toEqual({ error: "not found", id: expect.stringMatching(UUID) });
    expect(log.out.join("")).not.toMatch(/quiet|heron|secret-page/);
  });

  it("writes none of the caller's address, headers or pseudonym", async () => {
    const log = capture();
    const { base } = await start();
    const res = await fetch(`${base}/history?pseudonym=quiet%20heron&junk=1`, {
      headers: { "X-Forwarded-For": "198.51.100.23, 10.0.0.1", "User-Agent": "SecretAgent/9", "Sec-CH-UA": '"SecretBrowser";v="1"', "Accept-Language": "xx-SECRET", "X-Cloud-Trace-Context": "abcdef0123456789/1" },
    });
    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(log.lines()).toHaveLength(1));
    expect(log.lines()[0]).toMatchObject({ severity: "INFO", route: "/history", status: 200 });
    const written = log.out.join("");
    for (const secret of ["198.51.100.23", "10.0.0.1", "SecretAgent", "SecretBrowser", "xx-SECRET", "abcdef0123456789", "quiet", "heron", "junk", "127.0.0.1"]) expect(written).not.toContain(secret);
  });

  it("logs a bad body as a warning on /sessions, without the body, and returns the id", async () => {
    const log = capture();
    const { base } = await start();
    const res = await post(base, '{"answers":{"pseudonym":"quiet heron"}', { headers: { "Content-Type": "application/json", "User-Agent": "SecretAgent/9" } });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { id: string };
    await vi.waitFor(() => expect(log.lines()).toHaveLength(1));
    expect(log.lines()[0]).toMatchObject({ severity: "WARNING", method: "POST", route: "/sessions", status: 400, id: body.id });
    expect(log.out.join("")).not.toMatch(/quiet|heron|SecretAgent/);
  });

  it("logs a failure as an error with the same id in the body and in the error line", async () => {
    const log = capture();
    const { base } = await start(failingStore());
    const res = await post(base, makeSession());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; id: string };
    expect(body).toEqual({ error: "internal error", id: expect.stringMatching(UUID) });
    await vi.waitFor(() => expect(log.lines()).toHaveLength(1));
    expect(log.lines()[0]).toMatchObject({ severity: "ERROR", route: "/sessions", status: 500, id: body.id });
    const failed = log.out.join("").split("\n").filter(Boolean).map(l => JSON.parse(l) as Record<string, unknown>).find(l => l.message === "request failed");
    expect(failed).toMatchObject({ id: body.id });
  });

  it("gives every kind of error response an id, and each request its own", async () => {
    capture();
    const { base } = await start(new MemoryStore(), { postsPerMinute: 1, exportUrl: "" });
    const responses = [
      await fetch(`${base}/nope`),
      await fetch(`${base}/groups`, { method: "DELETE" }),
      await fetch(`${base}/history`),
      await fetch(`${base}/export`),
      await fetch(`${base}/healthz`, { headers: { Origin: "https://evil.example" } }),
      await post(base, "not json"),
      await post(base, "not json"),
    ];
    expect(responses.map(r => r.status)).toEqual([404, 404, 400, 404, 403, 400, 429]);
    const ids = await Promise.all(responses.map(async r => ((await r.json()) as { id: string }).id));
    for (const id of ids) expect(id).toMatch(UUID);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("leaves successful bodies and the CORS headers alone", async () => {
    capture();
    const { base } = await start();
    const res = await fetch(`${base}/healthz`, { headers: { Origin: ORIGIN } });
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect([...res.headers.keys()].some(k => k.includes("id"))).toBe(false);
  });
});
