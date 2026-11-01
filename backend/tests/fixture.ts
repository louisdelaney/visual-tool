// A complete, realistic session as the page would send it, for the tests to start from.
import { CALIBRATION, PROTOCOL } from "../../src/core/protocol";
import type { SessionExportV1 } from "../../src/app/schema";
import type { ContributionAnswers, Results, TaskResult, Trial } from "../../src/app/types";

const STARTED = "2026-10-18T19:30:00.000Z";
const FINISHED = "2026-10-18T19:39:12.000Z";

function makeTrials(count: number): Trial[] {
  const start = Date.parse(STARTED);
  return Array.from({ length: count }, (_, i): Trial => {
    const task = i < count / 2 ? "motion" : "form";
    const correct = i % 4 !== 3;
    return {
      protocol: "clinic",
      task,
      phase: i % 30 < 4 ? "practice" : i % 8 === 7 ? "catch" : "test",
      trial: (i % (count / 2)) + 1,
      level_pct: Math.max(10, 100 * 0.84 ** Math.floor(i / 6)),
      effective_level_pct: Math.max(10, 100 * 0.84 ** Math.floor(i / 6)),
      target: "left",
      response: correct ? "left" : "right",
      correct,
      rt_ms: 640 + (i % 7) * 35,
      reversal: i % 11 === 10,
      frames: 12,
      median_frame_ms: 16.7,
      dropped_frames: 0,
      display_ms: 200,
      flash1_ms: null,
      flash2_ms: null,
      spiral_deg: null,
      scale: 1,
      px_per_deg: 38.2,
      seed: 1000 + i,
      at: new Date(start + (i + 1) * 4_300).toISOString(),
    };
  });
}

const task = (threshold: number): TaskResult => ({
  status: "complete",
  threshold_pct: threshold,
  threshold_nominal_pct: threshold,
  sensitivity: Math.round((1 / threshold) * 1e5) / 1e5,
  reversals_pct: [14.1, 9.7, 11.8, 9.9, 10.6, 10.0, 10.5, 9.6, 10.4, 10.1],
  staircase_trials: 60,
  catch_correct: 7,
  catch_total: 7,
  all_trials: 64,
});

/** Overrides: any top-level field, with `answers` and `results` merged into the defaults. */
export type SessionOverrides = Partial<Omit<SessionExportV1, "contribution" | "results">> & {
  answers?: Partial<ContributionAnswers>;
  results?: Partial<Results>;
  /** Replaces the whole contribution (e.g. `{ contribute: false }`). */
  contribution?: SessionExportV1["contribution"];
};

export function makeSession(overrides: SessionOverrides = {}): SessionExportV1 {
  const { answers, results, contribution, ...rest } = overrides;
  const base: SessionExportV1 = {
    schema: "visual-tool/session",
    schema_version: 1,
    test_version: 1,
    page: "https://example.org/visual-tool/",
    started_at: STARTED,
    finished_at: FINISHED,
    ended_early: false,
    seed: 20261018,
    settings: { protocol: "clinic", motionDisplay: "brief", spiralDots: "flicker", order: "motion-first", run: "published" },
    protocol: {
      id: "clinic",
      parameters: PROTOCOL,
      calibration: { card_mm: CALIBRATION.cardMm, blind_spot_deg: CALIBRATION.blindSpotDeg, ipd_cm: CALIBRATION.ipdCm },
    },
    sensitivity_units: "1 / threshold in %",
    calibration: { cardPx: 324.5, pxPerMm: 3.791, dpr: 2, measuredAt: "2026-10-18T19:31:00.000Z" },
    viewing_distance: { cm: 62, method: "manual", readings: [61, 62, 63] },
    display: { ppd0: 38.2, scale: 1, viewport: [1440, 900], fullscreen: true, refresh_hz: 60, median_frame_ms: 16.7 },
    environment: { browser: "Chrome 131 on macOS", language: "en-GB", screen: [1512, 982], viewport: [1440, 900], devicePixelRatio: 2 },
    contribution: {
      contribute: true,
      submission_id: "00000000-0000-4000-8000-000000000000",
      sent_at: null,
      answers: {
        pseudonym: "Quiet Heron",
        perceptual_disorder: "no",
        condition: null,
        other_condition: null,
        diagnosed: null,
        psychedelics: "no",
        psychedelic_uses: null, psychedelics_used: null,
        takes_medication: "no",
        medications: null,
        notes: null,
        found_via: "forum",
        found_via_other: null,
      },
    },
    results: { motion: task(10.2), form: task(21.0), motion_minus_form: { sensitivity: 0.05, threshold_ratio: 0.486 } },
    trials: makeTrials(120),
  };

  let merged: SessionExportV1 = { ...base, ...rest };
  if (contribution !== undefined) merged = { ...merged, contribution };
  else if (answers && base.contribution?.contribute) merged = { ...merged, contribution: { ...base.contribution, answers: { ...base.contribution.answers, ...answers } } };
  if (results) merged = { ...merged, results: { ...base.results!, ...results } };
  return merged;
}

/** Shorthand for a session whose two tasks and difference are set to these numbers. */
export function withThresholds(motion: number, form: number, overrides: SessionOverrides = {}): SessionExportV1 {
  return makeSession({
    ...overrides,
    results: { motion: task(motion), form: task(form), motion_minus_form: { sensitivity: Math.round((1 / motion - 1 / form) * 1e5) / 1e5, threshold_ratio: motion / form } },
  });
}
