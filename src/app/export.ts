// The session as JSON (what's saved, copied and sent) and its trials as CSV.
import { CALIBRATION, Core, PROTOCOL } from "../core";
import type { Session, SessionContribution, Trial } from "./types";
import { round } from "./format";
import { SCHEMA_NAME, SCHEMA_VERSION, type ExportedContribution, type SessionExport } from "./schema";

export const CSV_COLUMNS: readonly (keyof Trial)[] = ["protocol", "task", "phase", "trial", "level_pct", "effective_level_pct", "target", "response", "correct", "rt_ms", "reversal", "frames", "median_frame_ms", "dropped_frames", "display_ms", "flash1_ms", "flash2_ms", "spiral_deg", "scale", "px_per_deg", "seed", "at"];

/** The contribution without its in-flight sending state. */
function exportContribution(c: SessionContribution): ExportedContribution {
  if (!c.contribute) return c;
  const { sending: _sending, failed: _failed, failure_id: _failureId, ...rest } = c;
  return rest;
}

export function exportObject(s: Session): SessionExport {
  return {
    schema: SCHEMA_NAME, schema_version: SCHEMA_VERSION, test_version: s.testVersion,
    page: s.page,
    started_at: s.startedAt, finished_at: s.finishedAt, ended_early: s.endedEarly, seed: s.seed,
    settings: s.settings,
    protocol: { id: s.settings.protocol, parameters: PROTOCOL, calibration: { card_mm: CALIBRATION.cardMm, blind_spot_deg: CALIBRATION.blindSpotDeg, ipd_cm: CALIBRATION.ipdCm } },
    sensitivity_units: "1 / threshold in %",
    calibration: s.calibration, viewing_distance: s.distance,
    display: {
      refresh_hz: s.refreshHz && round(s.refreshHz, 2),
      median_frame_ms: s.frameMs && round(s.frameMs, 3),
      ...s.display,
    },
    environment: s.env, contribution: s.contribution ? exportContribution(s.contribution) : null, results: s.results, trials: s.trials,
  };
}

export const sessionJSON = (s: Session): string => JSON.stringify(exportObject(s), null, 2);

export const trialsCSV = (s: Session): string => Core.toCSV(s.trials, CSV_COLUMNS);

export const fileBase = (s: Session): string =>
  `form-motion-coherence-${s.startedAt.slice(0, 16).replace(/[:T]/g, "-")}`;

/** Hands the browser a file to save. */
export function downloadFile(filename: string, data: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
