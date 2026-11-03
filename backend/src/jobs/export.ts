// The public download, rebuilt nightly by .github/workflows/export.yml: every stored session,
// as sent, written as one gzipped JSON file, visual-data.json, which the workflow publishes on
// the repository's "data" release as visual-data.json.gz.
// Each session is scrubbed as it's written (scrub.ts), so sessions stored before the page sent
// less still go out with times to the hour and only what the results need.
//   EXPORT_DIR      where the file goes (default ./data/export)
// A local server without EXPORT_URL builds the same file on each GET /export instead (server.ts).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { toHour, type AnySessionExport } from "../../../src/app/schema";
import { scrubSession } from "../scrub";
import { exportDir, openStore } from "../config";
import { logError, logInfo } from "../log";
import type { Store } from "../store";

export type ExportedSession = AnySessionExport & {
  submission_id: string;
  received_at: string;
};

/** The whole download. Written gzip-encoded; browsers and `curl --compressed` unpack it. */
export interface ExportFile {
  exported_at: string;
  schema: "visual-tool/export";
  total_sessions: number;
  /** In order of arrival. */
  sessions: ExportedSession[];
}

export const EXPORT_FILE = "visual-data.json";

export { toHour };

export function coarsen(id: string, receivedAt: string, s: AnySessionExport): ExportedSession {
  return { ...scrubSession(s), submission_id: id, received_at: toHour(receivedAt) };
}

export interface ExportSink {
  write(name: string, gz: Buffer, contentType: string, contentEncoding?: string): Promise<void>;
}

/** Files in a folder, with the same names. */
export function dirSink(dir: string): ExportSink {
  mkdirSync(dir, { recursive: true });
  return { async write(name, data) { writeFileSync(join(dir, name), data); } };
}

/**
 * Writes every session to the one file, replacing last night's. Rewriting it all each night is
 * simplest and, at a few MB a month gzipped, cheap enough. A session its sender removed
 * is gone from the next file; copies already downloaded can't be recalled.
 */
export async function runExport(db: Store, sink: ExportSink, now: Date = new Date()): Promise<ExportFile> {
  const rows: { receivedAt: string; session: ExportedSession }[] = [];
  for await (const { id, stored, session } of db.allSessions()) rows.push({ receivedAt: stored.received_at, session: coarsen(id, stored.received_at, session) });
  // By the exact time, before it's rounded, so sessions from the same hour keep their order.
  rows.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  const sessions = rows.map(r => r.session);
  const file: ExportFile = { exported_at: now.toISOString(), schema: "visual-tool/export", total_sessions: sessions.length, sessions };
  await sink.write(EXPORT_FILE, gzipSync(JSON.stringify(file)), "application/json", "gzip");
  return file;
}

if (process.argv[1] && /export\.(js|ts)$/.test(process.argv[1])) {
  const run = async () => runExport(await openStore(), dirSink(exportDir()));
  run()
    .then(i => logInfo(`exported ${i.total_sessions} sessions`))
    .catch(err => {
      logError("export failed", err);
      process.exit(1);
    });
}
