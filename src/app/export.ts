// The session as JSON (what's saved and sent), and a short summary of what the results page shows.
import { CALIBRATION, PROTOCOL } from "../core";
import type { Session, SessionContribution, TaskName, TaskResult } from "./types";
import { round } from "./format";
import { SCHEMA_NAME, SCHEMA_VERSION, type ExportedContribution, type SessionExport } from "./schema";

/** The contribution without its sending and removal state. */
function exportContribution(c: SessionContribution): ExportedContribution {
  if (!c.contribute) return c;
  const { sending: _sending, failed: _failed, failure_id: _failureId, delete_token: _deleteToken, removal: _removal, ...rest } = c;
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

/** One task's result as the summary gives it. */
const summaryResult = (r: TaskResult | null) =>
  r && { status: r.status, threshold_pct: r.threshold_pct && round(r.threshold_pct, 2), sensitivity: r.sensitivity && round(r.sensitivity, 4) };

/** The points a staircase chart draws: coherence on each scored trial. */
const staircasePoints = (s: Session, task: TaskName) =>
  s.trials.filter(t => t.task === task && t.phase === "test")
    .map(t => ({ trial: t.trial, coherence_pct: round(t.effective_level_pct, 2), correct: t.correct, reversal: t.reversal }));

/** A short, readable file of what the results page shows: pseudonym, answers, results and staircase points. */
export function summaryJSON(s: Session): string {
  const c = s.contribution?.contribute ? s.contribution : null;
  const { pseudonym = null, ...answers } = c?.answers ?? {};
  const R = s.results;
  const d = R?.motion_minus_form;
  return JSON.stringify({
    about: "Your results from the Form–Motion Coherence Test. Just for fun, not medical advice.",
    pseudonym,
    started_at: s.startedAt,
    test_version: s.testVersion,
    answers: c ? answers : null,
    results: {
      motion: summaryResult(R?.motion ?? null),
      form: summaryResult(R?.form ?? null),
      motion_minus_form: d ? { sensitivity: round(d.sensitivity, 4), threshold_ratio: round(d.threshold_ratio, 3) } : null,
    },
    staircases: { motion: staircasePoints(s, "motion"), form: staircasePoints(s, "form") },
  }, null, 2)
    // One line per staircase point, so the file stays short enough to read.
    .replace(/\{\n\s+"trial"[^}]*\}/g, p => p.replace(/\n\s*/g, " ").replace("{ ", "{").replace(/ \}$/, "}"));
}

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
