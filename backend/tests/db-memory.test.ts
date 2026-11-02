import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "../src/db-memory";
import { hashDeleteToken, MAX_GROUP_VALUES } from "../src/store";
import { TEST_VERSION } from "../../src/core/protocol";
import { makeSession, withThresholds } from "./fixture";

// The fixture runs the current test; another version is any other number.
const V = TEST_VERSION;

const dirs: string[] = [];
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), "memory-store-"));
  dirs.push(dir);
  return dir;
};
beforeEach(() => {
  vi.spyOn(process.stderr, "write").mockImplementation(() => true); // loading and failures are logged; keep the test output clean
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const at = (minute: number) => new Date(Date.UTC(2026, 9, 20, 12, minute));

describe("storeSession", () => {
  it("returns a new UUID each time", async () => {
    const store = new MemoryStore();
    const a = await store.storeSession(makeSession());
    const b = await store.storeSession(makeSession());
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(b).not.toBe(a);
    expect(store.size).toBe(2);
  });
});

describe("deleteSession", () => {
  const hash = hashDeleteToken("the token");

  it("removes the session, its history row and its group values, leaving the rest", async () => {
    const store = new MemoryStore();
    await store.storeSession(withThresholds(10, 20, { answers: { pseudonym: "blue fox" } }));
    const id = await store.storeSession(withThresholds(12, 24, { answers: { pseudonym: "blue fox" } }), at(1), hash);
    expect(await store.deleteSession(id, hash)).toBe(true);
    expect(store.size).toBe(1);
    expect(await store.readSession(id)).toBeUndefined();
    expect((await store.historyFor("blue fox")).map(r => r.submission_id)).not.toContain(id);
    expect((await store.readGroups(V))?.control?.motion).toEqual([10]);
  });

  it("removes only one of two sessions with the same values", async () => {
    const store = new MemoryStore();
    await store.storeSession(withThresholds(10, 20));
    const id = await store.storeSession(withThresholds(10, 20), at(1), hash);
    await store.deleteSession(id, hash);
    expect((await store.readGroups(V))?.control?.motion).toEqual([10]);
  });

  it("refuses a wrong token, an unknown id, and a session stored without a token", async () => {
    const store = new MemoryStore();
    const id = await store.storeSession(makeSession(), at(0), hash);
    const old = await store.storeSession(makeSession());
    expect(await store.deleteSession(id, hashDeleteToken("another"))).toBe(false);
    expect(await store.deleteSession("no-such-id", hash)).toBe(false);
    expect(await store.deleteSession(old, hash)).toBe(false);
    expect(store.size).toBe(2);
  });
});

describe("readGroups", () => {
  it("has nothing for a test version nobody ran", async () => {
    expect(await new MemoryStore().readGroups(V)).toBeUndefined();
  });

  it("puts control, psychedelics and neither in the right place", async () => {
    const store = new MemoryStore();
    await store.storeSession(withThresholds(10, 20));
    await store.storeSession(withThresholds(12, 24));
    await store.storeSession(withThresholds(9, 18, { answers: { psychedelics: "yes" } }));
    await store.storeSession(makeSession({ answers: { psychedelics: "prefer-not-to-say" } }));
    await store.storeSession(makeSession({ answers: { perceptual_disorder: "yes" } }));
    await store.storeSession(withThresholds(8, 16, { test_version: V + 1 }));

    const doc = await store.readGroups(V);
    expect(doc?.control?.motion).toEqual([10, 12]);
    expect(doc?.control?.form).toEqual([20, 24]);
    expect(doc?.control?.diff).toHaveLength(2);
    expect(doc?.psychedelics?.motion).toEqual([9]);
    expect(doc?.psychedelics?.diff).toHaveLength(1);
    expect(Object.keys(doc!).sort()).toEqual(["control", "psychedelics"]);
    expect((await store.readGroups(V + 1))?.control?.motion).toEqual([8]);
  });

  it("counts two sessions with the same threshold twice", async () => {
    const store = new MemoryStore();
    const twin = withThresholds(7.7, 15.5);
    await store.storeSession(twin);
    await store.storeSession(twin);
    expect((await store.readGroups(V))?.control?.motion).toEqual([7.7, 7.7]);
  });

  it("returns a copy, so a caller can't change what's stored", async () => {
    const store = new MemoryStore();
    await store.storeSession(withThresholds(10, 20));
    (await store.readGroups(V))!.control!.motion.push(99);
    expect((await store.readGroups(V))?.control?.motion).toEqual([10]);
  });
});

describe("historyFor", () => {
  it("returns one pseudonym's rows, oldest started first, and ignores others", async () => {
    const store = new MemoryStore();
    const late = await store.storeSession(makeSession({ started_at: "2026-10-19T08:00:00.000Z", finished_at: null }));
    const early = await store.storeSession(makeSession({ started_at: "2026-08-02T20:00:00.000Z", finished_at: null }));
    await store.storeSession(makeSession({ answers: { pseudonym: "someone else" } }));
    await store.storeSession(makeSession({ answers: { pseudonym: null } }));

    const rows = await store.historyFor("quiet heron");
    expect(rows.map(r => r.submission_id)).toEqual([early, late]);
    expect(rows[0]).toMatchObject({ pseudonym: "quiet heron", started_at: "2026-08-02T20:00:00.000Z" });
    expect(await store.historyFor("never used")).toEqual([]);
  });

  it("stops at the limit", async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 3; i++) await store.storeSession(makeSession({ started_at: `2026-10-0${i + 1}T10:00:00.000Z`, finished_at: null }));
    const rows = await store.historyFor("quiet heron", 2);
    expect(rows.map(r => r.started_at)).toEqual(["2026-10-01T10:00:00.000Z", "2026-10-02T10:00:00.000Z"]);
  });
});

describe("allSessions", () => {
  it("yields in received order with each body exactly as stored", async () => {
    const store = new MemoryStore();
    const sessions = [makeSession({ seed: 1 }), makeSession({ seed: 2 }), makeSession({ seed: 3 })];
    // Stored out of order: the generator sorts by arrival time.
    const ids = [await store.storeSession(sessions[0]!, at(5)), await store.storeSession(sessions[1]!, at(1)), await store.storeSession(sessions[2]!, at(3))];

    const seen = [];
    for await (const s of store.allSessions()) seen.push(s);
    expect(seen.map(s => s.id)).toEqual([ids[1], ids[2], ids[0]]);
    expect(seen.map(s => s.session)).toEqual([sessions[1], sessions[2], sessions[0]]);
    expect(seen.map(s => s.stored.received_at)).toEqual([at(1), at(3), at(5)].map(d => d.toISOString()));
    expect(seen[0]!.stored).toMatchObject({ schema_version: 1, test_version: V });
  });
});

describe("persistence", () => {
  it("reloads the same sessions, groups and histories from its file", async () => {
    const file = join(tempDir(), "data", "sessions.json"); // the folder doesn't exist yet
    const first = new MemoryStore(file);
    const a = await first.storeSession(withThresholds(10, 20), at(1));
    const b = await first.storeSession(withThresholds(9, 18, { answers: { psychedelics: "yes" }, started_at: "2026-08-02T20:00:00.000Z", finished_at: null }), at(2));

    const second = new MemoryStore(file);
    expect(second.size).toBe(2);
    expect(await second.readGroups(V)).toEqual(await first.readGroups(V));
    expect(await second.historyFor("quiet heron")).toEqual(await first.historyFor("quiet heron"));
    expect((await second.historyFor("quiet heron")).map(r => r.submission_id)).toEqual([b, a]);

    const seen = [];
    for await (const s of second.allSessions()) seen.push(s.id);
    expect(seen).toEqual([a, b]);
  });

  it("keeps adding to a reloaded store", async () => {
    const file = join(tempDir(), "sessions.json");
    await new MemoryStore(file).storeSession(withThresholds(10, 20));
    const second = new MemoryStore(file);
    await second.storeSession(withThresholds(11, 22));
    expect(new MemoryStore(file).size).toBe(2);
    expect((await new MemoryStore(file).readGroups(V))?.control?.motion).toEqual([10, 11]);
  });

  it("starts empty when the file doesn't exist, and creates it on the first store", async () => {
    const file = join(tempDir(), "missing.json");
    const store = new MemoryStore(file);
    expect(store.size).toBe(0);
    await store.storeSession(makeSession());
    expect(new MemoryStore(file).size).toBe(1);
  });

  it("refuses a file it can't read rather than starting empty over it", () => {
    const dir = tempDir();
    const file = join(dir, "sessions.json");
    writeFileSync(file, "{ not json");
    expect(() => new MemoryStore(file)).toThrow();
    // A folder where the file should be is a read error that isn't "missing".
    const folder = join(dir, "folder.json");
    mkdirSync(folder);
    expect(() => new MemoryStore(folder)).toThrow();
  });
});

describe("a full group", () => {
  // There's no way to fill a group by storing 30,000 sessions quickly, so start from a saved
  // file whose control group is already at the limit.
  function fullFile() {
    const file = join(tempDir(), "full.json");
    const values = Array.from({ length: MAX_GROUP_VALUES }, () => 10);
    const body = gzipSync(JSON.stringify(makeSession()));
    const snapshot = {
      sessions: { existing: { received_at: at(0).toISOString(), schema_version: 1, test_version: V, body_gzip: body.toString("base64") } },
      summaries: {},
      groups: { [String(V)]: { control: { motion: values, form: values, diff: values } } },
    };
    writeFileSync(file, JSON.stringify(snapshot));
    return file;
  }

  it("rejects another session for that group and stores nothing", async () => {
    const store = new MemoryStore(fullFile());
    await expect(store.storeSession(withThresholds(10, 20))).rejects.toThrow("group is full");
    expect(store.size).toBe(1);
    expect((await store.readGroups(V))?.control?.motion).toHaveLength(MAX_GROUP_VALUES);
  });

  it("still takes sessions for the other group, another version, or no group", async () => {
    const store = new MemoryStore(fullFile());
    await store.storeSession(withThresholds(10, 20, { answers: { psychedelics: "yes" } }));
    await store.storeSession(withThresholds(10, 20, { test_version: V + 1 }));
    await store.storeSession(makeSession({ answers: { perceptual_disorder: "yes" } }));
    expect(store.size).toBe(4);
  });
});
