import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryStore } from "../src/db-memory";
import { coarsen, dirSink, monthOf, runExport, toHour, type ExportedSession, type ExportIndex, type ExportSink } from "../src/jobs/export";
import { makeSession } from "./fixture";

/** A sink that keeps what's written to it. */
function memorySink() {
  const files = new Map<string, { data: Buffer; contentType: string; contentEncoding?: string }>();
  const sink: ExportSink = {
    async write(name, data, contentType, contentEncoding) {
      files.set(name, { data, contentType, ...(contentEncoding ? { contentEncoding } : {}) });
    },
  };
  return { sink, files };
}

const readMonth = (files: ReturnType<typeof memorySink>["files"], name: string) =>
  JSON.parse(gunzipSync(files.get(name)!.data).toString("utf8")) as { month: string; sessions: ExportedSession[] };

/** A store holding these sessions, each received at this time. */
async function storeWith(rows: { receivedAt: string; session: ReturnType<typeof makeSession> }[]) {
  const store = new MemoryStore();
  const ids: string[] = [];
  for (const r of rows) ids.push(await store.storeSession(r.session, new Date(r.receivedAt)));
  return { store, ids };
}

describe("toHour", () => {
  it("rounds down to the hour", () => {
    expect(toHour("2026-10-18T19:39:12.345Z")).toBe("2026-10-18T19:00:00.000Z");
    expect(toHour("2026-10-18T19:00:00.000Z")).toBe("2026-10-18T19:00:00.000Z");
  });
  it("works in UTC whatever the offset written", () => expect(toHour("2026-10-18T21:39:12+02:00")).toBe("2026-10-18T19:00:00.000Z"));
  it("leaves something that isn't a date as it is", () => expect(toHour("not a date")).toBe("not a date"));
});

describe("monthOf", () => {
  it("is the year and month of an ISO time", () => expect(monthOf("2026-10-31T23:59:59.000Z")).toBe("2026-10"));
});

describe("coarsen", () => {
  const s = makeSession();
  const out = coarsen("id-1", "2026-10-18T19:45:30.000Z", s);

  it("drops `at` from every trial and keeps the rest", () => {
    expect(out.trials).toHaveLength(s.trials.length);
    for (const [i, t] of out.trials.entries()) {
      expect(t).not.toHaveProperty("at");
      const { at: _at, ...rest } = s.trials[i]!;
      expect(t).toEqual(rest);
    }
  });

  it("rounds started_at, finished_at and received_at to the hour", () => {
    expect(out.started_at).toBe("2026-10-18T19:00:00.000Z");
    expect(out.finished_at).toBe("2026-10-18T19:00:00.000Z");
    expect(out.received_at).toBe("2026-10-18T19:00:00.000Z");
    expect(out.submission_id).toBe("id-1");
  });

  it("keeps a null finished_at", () => expect(coarsen("id", "2026-10-18T19:45:30.000Z", makeSession({ finished_at: null })).finished_at).toBeNull());

  it("leaves the rest of the session as it was", () => {
    const { trials: _t, started_at: _s, finished_at: _f, ...before } = s;
    const { trials: _t2, started_at: _s2, finished_at: _f2, submission_id: _i, received_at: _r, ...after } = out;
    expect(after).toEqual(before);
  });

  it("doesn't change the session it was given", () => {
    expect(s.trials[0]).toHaveProperty("at");
    expect(s.started_at).toBe("2026-10-18T19:30:00.000Z");
  });
});

describe("runExport", () => {
  const rows = [
    { receivedAt: "2026-09-15T10:00:00.000Z", session: makeSession({ seed: 1 }) },
    { receivedAt: "2026-10-02T08:20:00.000Z", session: makeSession({ seed: 2 }) },
    { receivedAt: "2026-10-18T19:45:00.000Z", session: makeSession({ seed: 3 }) },
  ];
  const now = new Date("2026-10-31T12:00:00.000Z");

  it("writes one gzipped file per month, then the index", async () => {
    const { sink, files } = memorySink();
    const { store, ids } = await storeWith(rows);
    const index = await runExport(store, sink, now);

    expect([...files.keys()]).toEqual(["sessions-2026-09.json", "sessions-2026-10.json", "index.json"]);

    const sep = files.get("sessions-2026-09.json")!;
    expect(sep.contentEncoding).toBe("gzip");
    expect(sep.contentType).toBe("application/json");
    const septemberFile = readMonth(files, "sessions-2026-09.json");
    expect(septemberFile.month).toBe("2026-09");
    expect(septemberFile.sessions.map(s => s.submission_id)).toEqual([ids[0]]);

    const october = readMonth(files, "sessions-2026-10.json");
    expect(october.month).toBe("2026-10");
    expect(october.sessions.map(s => [s.submission_id, s.seed])).toEqual([[ids[1], 2], [ids[2], 3]]);
    expect(october.sessions[1]).toEqual(coarsen(ids[2]!, rows[2]!.receivedAt, rows[2]!.session));
    expect(october.sessions.every(s => s.trials.every(t => !("at" in t)))).toBe(true);

    const written = JSON.parse(files.get("index.json")!.data.toString("utf8")) as ExportIndex;
    expect(written).toEqual(index);
    expect(written.exported_at).toBe(now.toISOString());
    expect(written.schema).toBe("visual-tool/export");
    expect(written.total_sessions).toBe(3);
    expect(written.files.map(f => [f.file, f.month, f.sessions])).toEqual([["sessions-2026-09.json", "2026-09", 1], ["sessions-2026-10.json", "2026-10", 2]]);
    expect(written.files.map(f => f.bytes)).toEqual([sep.data.length, files.get("sessions-2026-10.json")!.data.length]);
    // The index isn't encoded: it's small and read by hand.
    expect(files.get("index.json")!.contentEncoding).toBeUndefined();
  });

  it("writes an index with no files when nothing is stored", async () => {
    const { sink, files } = memorySink();
    const index = await runExport(new MemoryStore(), sink, now);
    expect([...files.keys()]).toEqual(["index.json"]);
    expect(index).toMatchObject({ files: [], total_sessions: 0 });
  });

  it("orders months by date even when sessions arrive out of order", async () => {
    const { sink, files } = memorySink();
    const { store } = await storeWith([rows[2]!, rows[0]!]);
    await runExport(store, sink, now);
    expect([...files.keys()]).toEqual(["sessions-2026-09.json", "sessions-2026-10.json", "index.json"]);
  });
});

describe("dirSink", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("writes the month files and the index into a folder it creates", async () => {
    const root = mkdtempSync(join(tmpdir(), "export-"));
    dirs.push(root);
    const dir = join(root, "nested", "export");
    const { store, ids } = await storeWith([
      { receivedAt: "2026-09-15T10:00:00.000Z", session: makeSession({ seed: 1 }) },
      { receivedAt: "2026-10-15T10:00:00.000Z", session: makeSession({ seed: 2 }) },
    ]);
    const index = await runExport(store, dirSink(dir), new Date("2026-10-31T12:00:00.000Z"));

    expect(readdirSync(dir).sort()).toEqual(["index.json", "sessions-2026-09.json", "sessions-2026-10.json"]);
    expect(JSON.parse(readFileSync(join(dir, "index.json"), "utf8"))).toEqual(index);
    const september = JSON.parse(gunzipSync(readFileSync(join(dir, "sessions-2026-09.json"))).toString("utf8")) as { month: string; sessions: ExportedSession[] };
    expect(september.month).toBe("2026-09");
    expect(september.sessions.map(s => s.submission_id)).toEqual([ids[0]]);
    expect(readFileSync(join(dir, "sessions-2026-10.json")).length).toBe(index.files[1]!.bytes);
  });

  it("overwrites files from an earlier run", async () => {
    const root = mkdtempSync(join(tmpdir(), "export-"));
    dirs.push(root);
    const { store } = await storeWith([{ receivedAt: "2026-10-15T10:00:00.000Z", session: makeSession() }]);
    await runExport(store, dirSink(root), new Date("2026-10-30T12:00:00.000Z"));
    await store.storeSession(makeSession({ seed: 9 }), new Date("2026-10-16T10:00:00.000Z"));
    const index = await runExport(store, dirSink(root), new Date("2026-10-31T12:00:00.000Z"));
    expect(index.total_sessions).toBe(2);
    expect((JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as ExportIndex).total_sessions).toBe(2);
  });
});
