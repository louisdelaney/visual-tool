// Firestore. Three collections, written together when a session arrives:
//   sessions/{id}   the body as sent, gzipped: read only by the export job
//   summaries/{id}  every answer and the three measures; GET /history reads it
//   groups/{tv}     flat arrays of the three measures per comparison group, for GET /groups
import { randomUUID } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { Firestore, type QueryDocumentSnapshot, type Transaction } from "@google-cloud/firestore";
import type { SessionExportV1 } from "../../src/app/schema";
import { logError } from "./log";
import { emptyGroupValues, type GroupsDoc } from "./stats";
import { MAX_GROUP_VALUES, type Store, type StoredSession } from "./store";
import { groupOf, measuresOf, summaryRow, type SummaryRow } from "./summary";

export type { StoredSession } from "./store";

export class Db implements Store {
  constructor(private readonly fs: Firestore = new Firestore({ ignoreUndefinedProperties: true, ...(process.env.FIRESTORE_DATABASE ? { databaseId: process.env.FIRESTORE_DATABASE } : {}) })) {}

  async storeSession(s: SessionExportV1, now: Date = new Date()): Promise<string> {
    const id = randomUUID();
    const stored: StoredSession = { received_at: now.toISOString(), schema_version: s.schema_version, test_version: s.test_version, body_gzip: gzipSync(JSON.stringify(s)) };
    const row = summaryRow(s, id);
    const group = groupOf(s);
    const groupRef = this.fs.collection("groups").doc(String(s.test_version));

    await this.fs.runTransaction(async (t: Transaction) => {
      if (group) {
        const snap = await t.get(groupRef);
        const doc = (snap.data() ?? {}) as GroupsDoc;
        const values = doc[group] ?? emptyGroupValues();
        if (values.motion.length >= MAX_GROUP_VALUES) {
          logError(`group ${group} for test version ${s.test_version} is full: the groups document needs sharding`);
          throw new Error("group is full");
        }
        const m = measuresOf(s);
        // A plain append, so two people with the same threshold both count (arrayUnion would merge them).
        values.motion.push(m.motion_threshold_pct!);
        values.form.push(m.form_threshold_pct!);
        values.diff.push(m.motion_minus_form!);
        t.set(groupRef, { [group]: values }, { merge: true });
      }
      t.set(this.fs.collection("sessions").doc(id), stored);
      t.set(this.fs.collection("summaries").doc(id), row);
    });
    return id;
  }

  async readGroups(testVersion: number): Promise<GroupsDoc | undefined> {
    const snap = await this.fs.collection("groups").doc(String(testVersion)).get();
    return snap.data() as GroupsDoc | undefined;
  }

  async historyFor(pseudonym: string, limit = 500): Promise<SummaryRow[]> {
    const q = await this.fs.collection("summaries").where("pseudonym", "==", pseudonym).orderBy("started_at").limit(limit).get();
    return q.docs.map(d => d.data() as SummaryRow);
  }

  async readSession(id: string): Promise<SessionExportV1 | undefined> {
    const snap = await this.fs.collection("sessions").doc(id).get();
    const stored = snap.data() as StoredSession | undefined;
    return stored && (JSON.parse(gunzipSync(stored.body_gzip).toString("utf8")) as SessionExportV1);
  }

  async *allSessions(pageSize = 200): AsyncGenerator<{ id: string; stored: StoredSession; session: SessionExportV1 }> {
    // The cursor is the last snapshot of the previous page: a snapshot positions the query by
    // every orderBy field, where a bare reference would be read as a value for the first one.
    let after: QueryDocumentSnapshot | null = null;
    for (;;) {
      let q = this.fs.collection("sessions").orderBy("received_at").orderBy("__name__").limit(pageSize);
      if (after) q = q.startAfter(after);
      const page = await q.get();
      for (const d of page.docs) {
        const stored = d.data() as StoredSession;
        yield { id: d.id, stored, session: JSON.parse(gunzipSync(stored.body_gzip).toString("utf8")) as SessionExportV1 };
      }
      if (page.size < pageSize) return;
      after = page.docs[page.size - 1]!;
    }
  }
}
