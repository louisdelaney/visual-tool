// The format of a session's JSON: what's saved, copied and sent to the backend.
//
// SCHEMA_VERSION covers the shape of this data: field names, types and meanings. Bump it by one
// whenever the shape changes, so the backend and analysis code know how to read each file. It's
// separate from the test's own version (TEST_VERSION in core/protocol.ts), which changes when
// what participants see or do changes.
//
// Files from before versioning have no schema_version: treat them as version 0. Their
// "version" field ("0.1.0" or "0.2.0") was the app version, and they may have had test settings.
//
// Version 2 added test_type, "full" or "quick". Version 1 files have none: every one of them
// is the full test. Version 2 also keeps only what's needed to read the results: the hour the
// test started and its duration instead of exact times, no trial times, the browser and major version only,
// the device type, and no language, screen size or card-measuring time.
import type { Calibration, Display, Distance, Environment, Results, SessionContribution, Settings, Trial } from "./types";
import type { CALIBRATION, Protocol, TestType } from "../core";

export const SCHEMA_NAME = "visual-tool/session";
export const SCHEMA_VERSION = 2;

/** The contribution as exported: without its sending state or the time it was sent. */
export type ExportedContribution =
  | { contribute: false }
  | Omit<Extract<SessionContribution, { contribute: true }>, "sent_at" | "sending" | "failed" | "failure_id" | "delete_token" | "removal">;

export interface SessionExportV2 {
  schema: typeof SCHEMA_NAME;
  schema_version: typeof SCHEMA_VERSION;
  test_version: number;
  /** Which test type ran. Quick and full results are never pooled. */
  test_type: TestType;
  page: string;
  /** The hour the test started, in UTC: never the exact time. */
  started_at: string;
  /** Seconds from start to finish, or null if it didn't finish. */
  duration_s: number | null;
  ended_early: boolean;
  seed: number;
  settings: Settings;
  protocol: {
    id: Settings["protocol"];
    parameters: Protocol;
    calibration: { card_mm: (typeof CALIBRATION)["cardMm"]; blind_spot_deg: number; ipd_cm: number };
  };
  sensitivity_units: "1 / threshold in %";
  calibration: Calibration | null;
  viewing_distance: Distance | null;
  display: Partial<Display> & { refresh_hz: number | null; median_frame_ms: number | null };
  environment: Environment;
  contribution: ExportedContribution | null;
  results: Results | null;
  trials: Trial[];
}

/**
 * The format before test_type: always the full test. These were sent with exact times and more
 * details than the results need; the backend keeps them as v2 keeps them (backend/src/scrub.ts).
 */
export type SessionExportV1 = Omit<SessionExportV2, "schema_version" | "test_type" | "duration_s" | "environment"> & {
  schema_version: 1;
  test_type?: undefined;
  /** As sent; the backend swaps it for duration_s. */
  finished_at?: string | null;
  duration_s?: number | null;
  /** No device type: these all came from computers. */
  environment: Partial<Environment>;
};

/** The current format. */
export type SessionExport = SessionExportV2;

/** A session in any format the backend has stored. */
export type AnySessionExport = SessionExportV1 | SessionExportV2;

/** An ISO time cut to the start of its hour, in UTC. */
export const toHour = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
};

/** Whole seconds between two ISO times, or null without an end. */
export const durationS = (start: string, end: string | null): number | null =>
  end === null ? null : Math.round((Date.parse(end) - Date.parse(start)) / 1000);

/** The test type a session ran: version 1 files are all the full test. */
export const testTypeOf = (s: { test_type?: TestType | undefined }): TestType => s.test_type ?? "full";
