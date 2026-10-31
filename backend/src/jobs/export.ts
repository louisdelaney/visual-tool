// The public download, rebuilt nightly by a Cloud Run Job: every stored session, as sent,
// written to a public bucket as one gzipped JSON file per month of arrival plus an index.
// Times are rounded to the hour and trial times dropped, which the README suggests: exact
// times help single people out and aren't needed to analyse the results.
//   EXPORT_BUCKET   the bucket's name; without it, the files go to the folder
//   EXPORT_DIR      (default ./data/export), which the server serves at /export/*
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { SessionExportV1 } from "../../../src/app/schema";
import { exportDir, openStore } from "../config";
import { logError, logInfo } from "../log";
import type { Store } from "../store";

export interface ExportedSession extends Omit<SessionExportV1, "trials"> {
  submission_id: string;
  received_at: string;
  trials: Omit<SessionExportV1["trials"][number], "at">[];
}

export interface MonthFile {
  file: string;
  month: string;
  sessions: number;
  bytes: number;
}

export interface ExportIndex {
  exported_at: string;
  schema: "visual-tool/export";
  /** Each file is gzip-encoded JSON `{ month, sessions: ExportedSession[] }`; browsers and `curl --compressed` unpack it. */
  files: MonthFile[];
  total_sessions: number;
}

export const toHour = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
};

export function coarsen(id: string, receivedAt: string, s: SessionExportV1): ExportedSession {
  const trials = s.trials.map(({ at: _at, ...rest }) => rest);
  return { ...s, submission_id: id, received_at: toHour(receivedAt), started_at: toHour(s.started_at), finished_at: s.finished_at && toHour(s.finished_at), trials };
}

export const monthOf = (iso: string): string => iso.slice(0, 7);

export interface ExportSink {
  write(name: string, gz: Buffer, contentType: string, contentEncoding?: string): Promise<void>;
}

export async function gcsSink(bucketName: string): Promise<ExportSink> {
  const { Storage } = await import("@google-cloud/storage");
  const bucket = new Storage().bucket(bucketName);
  return {
    async write(name, data, contentType, contentEncoding) {
      await bucket.file(name).save(data, {
        resumable: false,
        metadata: {
          contentType,
          ...(contentEncoding ? { contentEncoding } : {}),
          contentDisposition: `attachment; filename="${name}"`,
          cacheControl: "public, max-age=3600",
        },
      });
    },
  };
}

/** Files in a folder, with the same names; the server serves them with the bucket's headers. */
export function dirSink(dir: string): ExportSink {
  mkdirSync(dir, { recursive: true });
  return { async write(name, data) { writeFileSync(join(dir, name), data); } };
}

/**
 * Groups sessions by month of arrival and writes each month's file, then the index. Rewriting
 * every month each night is simplest and, at a few MB a month gzipped, cheap enough; months
 * only ever gain sessions, so nothing already published disappears.
 */
export async function runExport(db: Store, sink: ExportSink, now: Date = new Date()): Promise<ExportIndex> {
  const months = new Map<string, ExportedSession[]>();
  for await (const { id, stored, session } of db.allSessions()) {
    const m = monthOf(stored.received_at);
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(coarsen(id, stored.received_at, session));
  }
  const files: MonthFile[] = [];
  for (const month of [...months.keys()].sort()) {
    const sessions = months.get(month)!;
    const file = `sessions-${month}.json`;
    const gz = gzipSync(JSON.stringify({ month, sessions }));
    await sink.write(file, gz, "application/json", "gzip");
    files.push({ file, month, sessions: sessions.length, bytes: gz.length });
  }
  const index: ExportIndex = { exported_at: now.toISOString(), schema: "visual-tool/export", files, total_sessions: files.reduce((n, f) => n + f.sessions, 0) };
  await sink.write("index.json", Buffer.from(JSON.stringify(index, null, 2)), "application/json");
  return index;
}

if (process.argv[1] && /export\.(js|ts)$/.test(process.argv[1])) {
  const run = async () => {
    const dir = exportDir();
    const sink = dir ? dirSink(dir) : await gcsSink(process.env.EXPORT_BUCKET!);
    return runExport(await openStore(), sink);
  };
  run()
    .then(i => logInfo(`exported ${i.total_sessions} sessions in ${i.files.length} files`))
    .catch(err => {
      logError("export failed", err);
      process.exit(1);
    });
}
