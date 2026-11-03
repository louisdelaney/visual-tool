// The session as JSON (what's saved and sent), and a short summary of what the results pages show.
import { CALIBRATION, PROTOCOLS } from "../core";
import type { Session, SessionContribution, TaskName, TaskResult } from "./types";
import { round } from "./format";
import { SCHEMA_NAME, SCHEMA_VERSION, durationS, testTypeOf, toHour, type AnySessionExport, type ExportedContribution, type SessionExport } from "./schema";
import { runInfoOf } from "./history";

/** The contribution without its sending and removal state. */
function exportContribution(c: SessionContribution): ExportedContribution {
  if (!c.contribute) return c;
  return { contribute: true, submission_id: c.submission_id, answers: c.answers };
}

export function exportObject(s: Session): SessionExport {
  return {
    schema: SCHEMA_NAME, schema_version: SCHEMA_VERSION, test_version: s.testVersion, test_type: s.testType,
    page: s.page,
    started_at: toHour(s.startedAt), duration_s: durationS(s.startedAt, s.finishedAt), ended_early: s.endedEarly, seed: s.seed,
    settings: s.settings,
    protocol: { id: s.settings.protocol, parameters: PROTOCOLS[s.testType], calibration: { card_mm: CALIBRATION.cardMm, blind_spot_deg: CALIBRATION.blindSpotDeg, ipd_cm: CALIBRATION.ipdCm } },
    sensitivity_units: "1 / threshold in %",
    // Named fields only: a card measurement saved by an older version can carry more.
    calibration: s.calibration && { cardPx: s.calibration.cardPx, pxPerMm: s.calibration.pxPerMm, dpr: s.calibration.dpr },
    viewing_distance: s.distance,
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
const summaryResult = (r: TaskResult | null | undefined) =>
  r ? { status: r.status, threshold_pct: r.threshold_pct && round(r.threshold_pct, 2), sensitivity: r.sensitivity && round(r.sensitivity, 4) } : null;

/** The points a staircase chart draws: coherence on each scored trial. */
const staircasePoints = (s: AnySessionExport, task: TaskName) =>
  s.trials.filter(t => t.task === task && t.phase === "test")
    .map(t => ({ trial: t.trial, coherence_pct: round(t.effective_level_pct, 2), correct: t.correct, reversal: t.reversal }));

/** What both results pages show for one session: pseudonym, answers, results, how it was taken and the staircase points. */
export function sessionSummary(s: AnySessionExport) {
  const c = s.contribution?.contribute ? s.contribution : null;
  const { pseudonym = null, ...answers } = c?.answers ?? {};
  const R = s.results;
  const d = R?.motion_minus_form;
  const testType = testTypeOf(s);
  const run = runInfoOf(s);
  return {
    about: testType === "quick"
      ? "Results from the quick Form–Motion Coherence Test, a shorter run that gives less precise results than the full test. Just for fun, not medical advice."
      : "Results from the Form–Motion Coherence Test. Just for fun, not medical advice.",
    pseudonym,
    started_at: s.started_at,
    test_version: s.test_version,
    test_type: testType,
    answers: c ? answers : null,
    results: {
      motion: summaryResult(R?.motion),
      form: summaryResult(R?.form),
      motion_minus_form: d ? { sensitivity: round(d.sensitivity, 4), threshold_ratio: round(d.threshold_ratio, 3) } : null,
      easy_checks_missed: run.checks_missed,
    },
    taken_on: { device: run.device, viewing_distance_cm: run.distance_cm && round(run.distance_cm, 1), full_screen: run.fullscreen },
    staircases: { motion: staircasePoints(s, "motion"), form: staircasePoints(s, "form") },
  };
}

/** Pretty JSON with one line per staircase point, so a summary file stays short enough to read. */
const readable = (v: unknown): string =>
  JSON.stringify(v, null, 2).replace(/\{\n\s+"trial"[^}]*\}/g, p => p.replace(/\n\s*/g, " ").replace("{ ", "{").replace(/ \}$/, "}"));

/** The summary of the session just run. */
export const summaryJSON = (s: Session): string => readable(sessionSummary(exportObject(s)));

/** One past session's summary. */
export const pastSummaryJSON = (s: AnySessionExport): string => readable(sessionSummary(s));

/** Every past session's summary for a pseudonym, oldest first. */
export const allSummariesJSON = (pseudonym: string, sessions: readonly AnySessionExport[]): string =>
  readable({ pseudonym, summaries: sessions.map(sessionSummary) });

/** A file name for a session started at this time (an ISO string). */
export const fileBaseAt = (iso: string): string =>
  `form-motion-coherence-${iso.slice(0, 16).replace(/[:T]/g, "-")}`;

export const fileBase = (s: Session): string => fileBaseAt(s.startedAt);

/** Hands the browser a file to save. */
export function downloadFile(filename: string, data: string | Uint8Array, type: string): void {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
