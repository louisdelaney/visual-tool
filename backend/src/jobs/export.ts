// The public download, rebuilt nightly by a Cloud Run Job: every stored session, as sent,
// written to a public bucket as one gzipped JSON file, visual-data.json.
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

/** The whole download. Written gzip-encoded; browsers and `curl --compressed` unpack it. */
export interface ExportFile {
  exported_at: string;
  schema: "visual-tool/export";
  total_sessions: number;
  /** In order of arrival. */
  sessions: ExportedSession[];
}

export const EXPORT_FILE = "visual-data.json";

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
 * Writes every session to the one file, replacing last night's. Rewriting it all each night is
 * simplest and, at a few MB a month gzipped, cheap enough; sessions are only ever added, so
 * nothing already published disappears.
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
  const run = async () => {
    const dir = exportDir();
    const sink = dir ? dirSink(dir) : await gcsSink(process.env.EXPORT_BUCKET!);
    return runExport(await openStore(), sink);
  };
  run()
    .then(i => logInfo(`exported ${i.total_sessions} sessions`))
    .catch(err => {
      logError("export failed", err);
      process.exit(1);
    });
}
