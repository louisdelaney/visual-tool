import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryStore } from "../src/db-memory";
import { coarsen, dirSink, runExport, toHour, type ExportFile, type ExportSink } from "../src/jobs/export";
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

const readExport = (data: Buffer) => JSON.parse(gunzipSync(data).toString("utf8")) as ExportFile;

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

  it("writes every session to one gzipped file, in order of arrival", async () => {
    const { sink, files } = memorySink();
    const { store, ids } = await storeWith([rows[2]!, rows[0]!, rows[1]!]);
    const result = await runExport(store, sink, now);

    expect([...files.keys()]).toEqual(["visual-data.json"]);
    const file = files.get("visual-data.json")!;
    expect(file.contentEncoding).toBe("gzip");
    expect(file.contentType).toBe("application/json");

    const written = readExport(file.data);
    expect(written).toEqual(result);
    expect(written.exported_at).toBe(now.toISOString());
    expect(written.schema).toBe("visual-tool/export");
    expect(written.total_sessions).toBe(3);
    expect(written.sessions.map(s => [s.submission_id, s.seed])).toEqual([[ids[1], 1], [ids[2], 2], [ids[0], 3]]);
    expect(written.sessions[2]).toEqual(coarsen(ids[0]!, rows[2]!.receivedAt, rows[2]!.session));
    expect(written.sessions.every(s => s.trials.every(t => !("at" in t)))).toBe(true);
  });

  it("orders sessions from the same hour by their exact arrival", async () => {
    const { sink, files } = memorySink();
    const { store, ids: stored } = await storeWith([
      { receivedAt: "2026-10-18T19:50:00.000Z", session: makeSession({ seed: 2 }) },
      { receivedAt: "2026-10-18T19:10:00.000Z", session: makeSession({ seed: 1 }) },
    ]);
    await runExport(store, sink, now);
    expect(readExport(files.get("visual-data.json")!.data).sessions.map(s => s.submission_id)).toEqual([stored[1], stored[0]]);
  });

  it("writes a file with no sessions when nothing is stored", async () => {
    const { sink, files } = memorySink();
    const result = await runExport(new MemoryStore(), sink, now);
    expect([...files.keys()]).toEqual(["visual-data.json"]);
    expect(result).toMatchObject({ sessions: [], total_sessions: 0 });
  });
});

describe("dirSink", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("writes the file into a folder it creates", async () => {
    const root = mkdtempSync(join(tmpdir(), "export-"));
    dirs.push(root);
    const dir = join(root, "nested", "export");
    const { store, ids } = await storeWith([
      { receivedAt: "2026-09-15T10:00:00.000Z", session: makeSession({ seed: 1 }) },
      { receivedAt: "2026-10-15T10:00:00.000Z", session: makeSession({ seed: 2 }) },
    ]);
    const result = await runExport(store, dirSink(dir), new Date("2026-10-31T12:00:00.000Z"));

    expect(readdirSync(dir)).toEqual(["visual-data.json"]);
    expect(readExport(readFileSync(join(dir, "visual-data.json")))).toEqual(result);
    expect(result.sessions.map(s => s.submission_id)).toEqual(ids);
  });

  it("overwrites files from an earlier run", async () => {
    const root = mkdtempSync(join(tmpdir(), "export-"));
    dirs.push(root);
    const { store } = await storeWith([{ receivedAt: "2026-10-15T10:00:00.000Z", session: makeSession() }]);
    await runExport(store, dirSink(root), new Date("2026-10-30T12:00:00.000Z"));
    await store.storeSession(makeSession({ seed: 9 }), new Date("2026-10-16T10:00:00.000Z"));
    const result = await runExport(store, dirSink(root), new Date("2026-10-31T12:00:00.000Z"));
    expect(result.total_sessions).toBe(2);
    expect(readExport(readFileSync(join(root, "visual-data.json"))).total_sessions).toBe(2);
  });
});
