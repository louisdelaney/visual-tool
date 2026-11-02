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
// is the full test.
import type { Calibration, Display, Distance, Environment, Results, SessionContribution, Settings, Trial } from "./types";
import type { CALIBRATION, Protocol, TestType } from "../core";

export const SCHEMA_NAME = "visual-tool/session";
export const SCHEMA_VERSION = 2;

/** The contribution as exported: without its in-flight sending state. */
export type ExportedContribution =
  | { contribute: false }
  | Omit<Extract<SessionContribution, { contribute: true }>, "sending" | "failed" | "failure_id" | "delete_token" | "removal">;

export interface SessionExportV2 {
  schema: typeof SCHEMA_NAME;
  schema_version: typeof SCHEMA_VERSION;
  test_version: number;
  /** Which test type ran. Quick and full results are never pooled. */
  test_type: TestType;
  page: string;
  started_at: string;
  finished_at: string | null;
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

/** The format before test_type: always the full test. */
export type SessionExportV1 = Omit<SessionExportV2, "schema_version" | "test_type"> & { schema_version: 1; test_type?: undefined };

/** The current format. */
export type SessionExport = SessionExportV2;

/** A session in any format the backend has stored. */
export type AnySessionExport = SessionExportV1 | SessionExportV2;

/** The test type a session ran: version 1 files are all the full test. */
export const testTypeOf = (s: { test_type?: TestType | undefined }): TestType => s.test_type ?? "full";
