// The format of a session's JSON: what's saved, copied and sent to the backend.
//
// SCHEMA_VERSION covers the shape of this data: field names, types and meanings. Bump it by one
// whenever the shape changes, so the backend and analysis code know how to read each file. It's
// separate from the test's own version (TEST_VERSION in core/protocol.ts), which changes when
// what participants see or do changes.
//
// Files from before versioning have no schema_version: treat them as version 0. Their
// "version" field ("0.1.0" or "0.2.0") was the app version, and they may have had test settings.
import type { Calibration, Display, Distance, Environment, Results, SessionContribution, Settings, Trial } from "./types";
import type { CALIBRATION, Protocol } from "../core";

export const SCHEMA_NAME = "visual-tool/session";
export const SCHEMA_VERSION = 1;

/** The contribution as exported: without its in-flight sending state. */
export type ExportedContribution =
  | { contribute: false }
  | Omit<Extract<SessionContribution, { contribute: true }>, "sending" | "failed" | "failure_id" | "delete_token" | "removal">;

export interface SessionExportV1 {
  schema: typeof SCHEMA_NAME;
  schema_version: typeof SCHEMA_VERSION;
  test_version: number;
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

/** The current format. */
export type SessionExport = SessionExportV1;
