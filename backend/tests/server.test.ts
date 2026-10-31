import { mkdtempSync, rmSync } from "node:fs";
import { createServer, get, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseGroups } from "../../src/app/comparison";
import { parseHistory } from "../../src/app/history";
import { MemoryStore } from "../src/db-memory";
import { dirSink, runExport } from "../src/jobs/export";
import { createApp, type ServerOptions } from "../src/server";
import { makeSession, withThresholds } from "./fixture";

const ORIGIN = "https://site.example";
const EXPORT_URL = "https://storage.example/index.json";

const servers: Server[] = [];
const tempDirs: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
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

/** A GET that sends the path exactly as given: fetch would tidy `/export/../x` into `/x`. */
const rawGet = (base: string, path: string) =>
  new Promise<number>((resolve, reject) => {
    const { hostname, port } = new URL(base);
    get({ hostname, port, path }, res => { res.resume(); resolve(res.statusCode!); }).on("error", reject);
  });

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
    const res = await post(base, makeSession({ test_version: 0 }));
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
    expect(await res.json()).toEqual({ error: "body too large" });
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
    expect(await res.json()).toEqual({ error: "internal error" });
  });
});

/** Stores this many control sessions, each with its own thresholds. */
const storeControls = async (db: MemoryStore, count: number) => {
  for (let i = 0; i < count; i++) await db.storeSession(withThresholds(5 + i, 10 + i));
};

describe("GET /groups", () => {
  it("returns group statistics the page accepts, cacheable for five minutes", async () => {
    const db = new MemoryStore();
    await storeControls(db, 30);
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    const res = await fetch(`${base}/groups?test_version=1`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    const parsed = parseGroups(await res.json());
    expect(parsed).not.toBeNull();
    expect(parsed!.groups.control.n).toBe(30);
    expect(parsed!.groups.control.measures).not.toBeNull();
    expect(parsed!.groups.psychedelics).toEqual({ n: 0, measures: null });
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("returns 400 without a test_version, or with one that isn't a positive integer", async () => {
    const { base } = await start();
    for (const query of ["", "?test_version=", "?test_version=0", "?test_version=1.5", "?test_version=abc"]) {
      expect((await fetch(`${base}/groups${query}`)).status, query).toBe(400);
    }
  });

  it("reads the store once for repeated requests", async () => {
    const db = new MemoryStore();
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    await fetch(`${base}/groups?test_version=1`);
    await fetch(`${base}/groups?test_version=1`);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("drops the cached statistics when a session for that version is stored", async () => {
    const db = new MemoryStore();
    const spy = vi.spyOn(db, "readGroups");
    const { base } = await start(db);
    await fetch(`${base}/groups?test_version=1`);
    await post(base, makeSession());
    await fetch(`${base}/groups?test_version=1`);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("shows a posted session in the groups: hidden below 30, summarised at 30", async () => {
    const db = new MemoryStore();
    await storeControls(db, 29);
    const { base } = await start(db);
    const groups = async () => parseGroups(await (await fetch(`${base}/groups?test_version=1`)).json())!.groups;

    expect((await groups()).control).toEqual({ n: 29, measures: null });
    expect((await post(base, withThresholds(40, 50))).status).toBe(201);
    const control = (await groups()).control;
    expect(control.n).toBe(30);
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

  it("returns 404 when none is set", async () => {
    const { base } = await start(new MemoryStore(), { exportUrl: "" });
    const res = await fetch(`${base}/export`, { redirect: "manual" });
    expect(res.status).toBe(404);
  });
});

describe("GET /export/*", () => {
  /** A temp folder holding a real export of two months. */
  async function exported() {
    const dir = mkdtempSync(join(tmpdir(), "export-"));
    tempDirs.push(dir);
    const db = new MemoryStore();
    await db.storeSession(makeSession({ seed: 1 }), new Date("2026-09-15T10:00:00Z"));
    await db.storeSession(makeSession({ seed: 2 }), new Date("2026-10-15T10:00:00Z"));
    await runExport(db, dirSink(dir), new Date("2026-10-31T12:00:00Z"));
    return start(new MemoryStore(), { exportDir: dir });
  }

  it("serves the index as plain JSON", async () => {
    const { base } = await exported();
    const res = await fetch(`${base}/export/index.json`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-encoding")).toBeNull();
    expect(res.headers.get("content-type")).toBe("application/json");
    const index = (await res.json()) as { total_sessions: number; files: { file: string }[] };
    expect(index.total_sessions).toBe(2);
    expect(index.files.map(f => f.file)).toEqual(["sessions-2026-09.json", "sessions-2026-10.json"]);
  });

  it("serves a month file gzip-encoded, which fetch unpacks", async () => {
    const { base } = await exported();
    const res = await fetch(`${base}/export/sessions-2026-10.json`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-encoding")).toBe("gzip");
    const month = (await res.json()) as { month: string; sessions: { seed: number }[] };
    expect(month.month).toBe("2026-10");
    expect(month.sessions.map(s => s.seed)).toEqual([2]);
  });

  it("returns 404 for a file that isn't there, and for paths that climb out of the folder", async () => {
    const { base } = await exported();
    expect((await fetch(`${base}/export/nope.json`)).status).toBe(404);
    expect((await fetch(`${base}/export/../package.json`)).status).toBe(404); // fetch resolves this to /package.json
    expect(await rawGet(base, "/export/../package.json")).toBe(404);
    expect(await rawGet(base, "/export/%2e%2e/package.json")).toBe(404);
    expect(await rawGet(base, "/export/..%2fpackage.json")).toBe(404);
  });

  it("serves nothing under /export/ when no folder is set", async () => {
    const { base } = await start();
    expect((await fetch(`${base}/export/index.json`)).status).toBe(404);
  });
});

describe("CORS", () => {
  it("answers a preflight from the allowed origin with 204 and the allow headers", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/sessions`, { method: "OPTIONS", headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" } });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    expect(res.headers.get("access-control-allow-headers")).toContain("Content-Type");
  });

  it("refuses another origin with 403", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/groups?test_version=1`, { headers: { Origin: "https://evil.example" } });
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
    const res = await fetch(`${base}/groups?test_version=1`);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows each of several comma-separated origins, and no other", async () => {
    const other = "http://localhost:5180";
    const { base } = await start(undefined, { allowedOrigin: `${ORIGIN}, ${other}` });
    for (const origin of [ORIGIN, other]) {
      const res = await fetch(`${base}/groups?test_version=1`, { headers: { Origin: origin } });
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe(origin);
    }
    expect((await fetch(`${base}/groups?test_version=1`, { headers: { Origin: "http://localhost:5181" } })).status).toBe(403);
  });

  it("adds the CORS header to responses for the allowed origin", async () => {
    const { base } = await start();
    const res = await fetch(`${base}/groups?test_version=1`, { headers: { Origin: ORIGIN } });
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
    expect((await fetch(`${base}/groups?test_version=1`, { method: "POST" })).status).toBe(404);
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
    expect((await fetch(`${base}/groups?test_version=1`)).status).toBe(200);
    expect((await fetch(`${base}/groups?test_version=1`)).status).toBe(429);
  });
});
