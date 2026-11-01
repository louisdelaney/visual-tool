// Runs against the Firestore emulator, and is skipped when it isn't running:
//   firebase emulators:start --only firestore
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test
import { randomUUID } from "node:crypto";
import { Firestore } from "@google-cloud/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SessionExportV1 } from "../../src/app/schema";
import { Db } from "../src/db";
import { makeSession, withThresholds } from "./fixture";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("Db on the Firestore emulator", () => {
  let fs: Firestore;
  let db: Db;

  // Stored in this order; the first and last share a pseudonym, and the last started earliest.
  const controlA = withThresholds(10.2, 21.0, { started_at: "2026-10-18T19:30:00.000Z", finished_at: "2026-10-18T19:39:00.000Z", answers: { pseudonym: "Quiet Heron", notes: "second run" } });
  const controlB = withThresholds(12.4, 25.5, { started_at: "2026-10-19T08:00:00.000Z", finished_at: "2026-10-19T08:09:00.000Z", answers: { pseudonym: null } });
  const psychedelicsC = withThresholds(9.1, 19.3, { started_at: "2026-08-02T20:00:00.000Z", finished_at: "2026-08-02T20:09:00.000Z", answers: { pseudonym: " quiet  heron ", psychedelics: "yes", medications: ["Lamotrigine"] } });
  const stored: SessionExportV1[] = [controlA, controlB, psychedelicsC];
  const ids: string[] = [];

  beforeAll(async () => {
    // A new database per run, so runs (and parallel files) don't see each other's documents, nor
    // the backend's own data. A new project id isn't enough: the gcloud emulator in compose.yaml
    // keeps every project's documents together, and only databases apart.
    fs = new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "demo-visual-tool", databaseId: `test-${randomUUID().slice(0, 8)}`, ignoreUndefinedProperties: true });
    db = new Db(fs);
    for (const [i, s] of stored.entries()) ids.push(await db.storeSession(s, new Date(Date.UTC(2026, 9, 20, 12, i))));
  });

  afterAll(async () => {
    await fs.terminate();
  });

  it("gives every session its own id", () => {
    expect(new Set(ids).size).toBe(3);
  });

  it("keeps the values of each group in arrays", async () => {
    const doc = await db.readGroups(1);
    expect(doc?.control?.motion).toEqual([10.2, 12.4]);
    expect(doc?.control?.form).toEqual([21.0, 25.5]);
    expect(doc?.control?.diff).toHaveLength(2);
    expect(doc?.psychedelics?.motion).toEqual([9.1]);
    expect(doc?.psychedelics?.form).toEqual([19.3]);
    expect(doc?.psychedelics?.diff).toHaveLength(1);
  });

  it("has no groups document for a test version nobody ran", async () => {
    expect(await db.readGroups(99)).toBeUndefined();
  });

  it("counts two people with the same threshold twice", async () => {
    const twin = withThresholds(7.7, 15.5, { test_version: 2, answers: { pseudonym: null } });
    await db.storeSession(twin);
    await db.storeSession(twin);
    expect((await db.readGroups(2))?.control?.motion).toEqual([7.7, 7.7]);
  });

  it("keeps a session out of the groups if it isn't in one", async () => {
    await db.storeSession(makeSession({ test_version: 3, answers: { psychedelics: "prefer-not-to-say", pseudonym: null } }));
    expect(await db.readGroups(3)).toBeUndefined();
  });

  it("returns a pseudonym's history oldest first, matching how it was stored", async () => {
    const rows = await db.historyFor("quiet heron");
    expect(rows.map(r => r.submission_id)).toEqual([ids[2], ids[0]]);
    expect(rows.map(r => r.started_at)).toEqual([psychedelicsC.started_at, controlA.started_at]);
    expect(rows[0]).toMatchObject({ pseudonym: "quiet heron", psychedelics: "yes", medications: ["Lamotrigine"], values: { motion_threshold_pct: 9.1, form_threshold_pct: 19.3 } });
    expect(rows[1]).toMatchObject({ notes: "second run" });
  });

  it("returns nothing for a pseudonym nobody used", async () => {
    expect(await db.historyFor("never used")).toEqual([]);
  });

  it("streams every session in arrival order, as stored", async () => {
    const seen: { id: string; stored: { received_at: string }; session: SessionExportV1 }[] = [];
    for await (const s of db.allSessions(2)) seen.push(s); // a page size of 2 makes it fetch twice
    // The other tests store a few more sessions; these three are among them.
    const mine = seen.filter(s => ids.includes(s.id));
    expect(mine.map(s => s.id)).toEqual(ids);
    expect(mine.map(s => s.session)).toEqual(stored);
    expect(mine.map(s => s.stored.received_at)).toEqual([0, 1, 2].map(i => new Date(Date.UTC(2026, 9, 20, 12, i)).toISOString()));
  });
});
