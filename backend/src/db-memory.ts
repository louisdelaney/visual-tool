// The in-memory store: the same behaviour as Firestore's, over Maps, so the backend runs with
// no Google account at all. Optionally persisted to one JSON file after every write, which is
// fine for a laptop and nowhere else. Refused on Cloud Run (see server.ts).
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import type { SessionExportV1 } from "../../src/app/schema";
import { logError, logInfo } from "./log";
import { emptyGroupValues, type GroupsDoc } from "./stats";
import { MAX_GROUP_VALUES, type Store, type StoredSession } from "./store";
import { groupOf, measuresOf, summaryRow, type SummaryRow } from "./summary";

interface Snapshot {
  sessions: Record<string, Omit<StoredSession, "body_gzip"> & { body_gzip: string }>;
  summaries: Record<string, SummaryRow>;
  groups: Record<string, GroupsDoc>;
}

export class MemoryStore implements Store {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly summaries = new Map<string, SummaryRow>();
  private readonly groups = new Map<string, GroupsDoc>();

  /** `file` is read if it exists and rewritten after every store. */
  constructor(private readonly file?: string) {
    if (file) this.load(file);
  }

  async storeSession(s: SessionExportV1, now: Date = new Date()): Promise<string> {
    const id = randomUUID();
    const group = groupOf(s);
    // The same order as the Firestore transaction: the group check first, so a full group
    // rejects the write before anything is stored.
    if (group) {
      const key = String(s.test_version);
      const doc = this.groups.get(key) ?? {};
      const values = doc[group] ?? emptyGroupValues();
      if (values.motion.length >= MAX_GROUP_VALUES) {
        logError(`group ${group} for test version ${key} is full`);
        throw new Error("group is full");
      }
      const m = measuresOf(s);
      values.motion.push(m.motion_threshold_pct!);
      values.form.push(m.form_threshold_pct!);
      values.diff.push(m.motion_minus_form!);
      this.groups.set(key, { ...doc, [group]: values });
    }
    this.sessions.set(id, { received_at: now.toISOString(), schema_version: s.schema_version, test_version: s.test_version, body_gzip: gzipSync(JSON.stringify(s)) });
    this.summaries.set(id, summaryRow(s, id));
    this.save();
    return id;
  }

  async readGroups(testVersion: number): Promise<GroupsDoc | undefined> {
    const doc = this.groups.get(String(testVersion));
    return doc && structuredClone(doc);
  }

  async historyFor(pseudonym: string, limit = 500): Promise<SummaryRow[]> {
    return [...this.summaries.values()]
      .filter(r => r.pseudonym === pseudonym)
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
      .slice(0, limit)
      .map(r => structuredClone(r));
  }

  async *allSessions(): AsyncGenerator<{ id: string; stored: StoredSession; session: SessionExportV1 }> {
    const ordered = [...this.sessions.entries()].sort(([ia, a], [ib, b]) => a.received_at.localeCompare(b.received_at) || ia.localeCompare(ib));
    for (const [id, stored] of ordered) yield { id, stored, session: JSON.parse(gunzipSync(stored.body_gzip).toString("utf8")) as SessionExportV1 };
  }

  get size(): number {
    return this.sessions.size;
  }

  private load(file: string): void {
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
      throw err;
    }
    const snap = JSON.parse(text) as Snapshot;
    for (const [id, s] of Object.entries(snap.sessions)) this.sessions.set(id, { ...s, body_gzip: Buffer.from(s.body_gzip, "base64") });
    for (const [id, r] of Object.entries(snap.summaries)) this.summaries.set(id, r);
    for (const [k, g] of Object.entries(snap.groups)) this.groups.set(k, g);
    logInfo(`loaded ${this.sessions.size} sessions from ${file}`);
  }

  private save(): void {
    if (!this.file) return;
    const snap: Snapshot = { sessions: {}, summaries: Object.fromEntries(this.summaries), groups: Object.fromEntries(this.groups) };
    for (const [id, s] of this.sessions) snap.sessions[id] = { ...s, body_gzip: s.body_gzip.toString("base64") };
    mkdirSync(dirname(this.file), { recursive: true });
    // Write beside, then rename, so a crash mid-write can't leave a half file.
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(snap));
    renameSync(tmp, this.file);
  }
}
