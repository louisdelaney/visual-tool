// The shapes of everything the app keeps and exports. Field names in snake_case are written
// to the JSON and CSV exports as they are, so changing them changes the data format.
import type { Staircase } from "../core";

export type TaskName = "motion" | "form";
export type Step = "contribute" | "setup" | "screen" | "distance" | TaskName | "results";

/** Pages outside the steps, each with its own address (#history and so on) so they can be linked to. */
export type InfoPage = "history" | "privacy" | "references";

export type View = Step | InfoPage;

export const INFO_PAGES: readonly InfoPage[] = ["history", "privacy", "references"];

/**
 * How a session was run. There's one version of the test and nothing is configurable, but every
 * export still records this so sessions from older versions, which had options, can be told apart.
 */
export interface Settings {
  protocol: "clinic";
  motionDisplay: "brief";
  spiralDots: "flicker";
  order: "motion-first";
  run: "published";
}

export interface Calibration {
  cardPx: number;
  pxPerMm: number;
  dpr: number;
  measuredAt: string;
}

export interface BlindSpotReading {
  distance_cm: number;
  simple_formula_cm: number;
  square_cm: number;
  dot_cm: number;
  layout: "edge" | "centre";
}

export type Distance =
  | { cm: number; method: "manual"; readings: number[] }
  | {
      cm: number;
      method: "blind-spot";
      readings: number[];
      model: { angle_deg: number; solve: string; eye: string; ipd_cm: number; positions: string };
      detail: BlindSpotReading[];
      fullscreen: boolean;
      viewport_cm: [number, number];
    };

export type Answer = "left" | "right" | "up" | "down" | "1" | "2";
export type TrialPhase = "practice" | "test" | "catch";

export interface Trial {
  protocol: Settings["protocol"];
  task: TaskName;
  phase: TrialPhase;
  trial: number;
  level_pct: number;
  effective_level_pct: number;
  target: Answer;
  response: Answer;
  correct: boolean;
  rt_ms: number;
  reversal: boolean;
  frames: number | null;
  median_frame_ms: number | null;
  dropped_frames: number | null;
  display_ms: number | null;
  flash1_ms: number | null;
  flash2_ms: number | null;
  spiral_deg: number | null;
  scale: number;
  px_per_deg: number;
  seed: number | null;
  at: string;
}

export interface TaskRecord {
  task: TaskName;
  staircase: Staircase;
  trials: Trial[];
  endedEarly: boolean;
}

export interface TaskResult {
  status: "complete" | "incomplete" | "not reached";
  threshold_pct: number | null;
  threshold_nominal_pct: number | null;
  sensitivity: number | null;
  reversals_pct: number[];
  staircase_trials: number;
  catch_correct: number;
  catch_total: number;
  all_trials: number;
}

export interface Results {
  motion: TaskResult | null;
  form: TaskResult | null;
  motion_minus_form: { sensitivity: number; threshold_ratio: number } | null;
}

export interface Display {
  ppd0: number;
  scale: number;
  viewport: [number, number];
  fullscreen: boolean;
}

export interface Environment {
  /** Browser, major version and system, like "Chrome 131 on macOS": not the full user-agent string, which helps fingerprint people. */
  browser: string;
  language: string;
  screen: [number, number];
  viewport: [number, number];
  devicePixelRatio: number;
}

// ----- Contribute -----

export type YesNo = "yes" | "no";
export type Condition = "vss" | "hppd" | "other";
export type PsychedelicUse = "yes" | "no" | "prefer-not-to-say";
export type FoundVia = "reddit" | "forum" | "other";

export interface ContributionAnswers {
  pseudonym: string | null;
  perceptual_disorder: YesNo | null;
  /** Which disorder, when perceptual_disorder is "yes": one only. */
  condition: Condition | null;
  other_condition: string | null;
  diagnosed: YesNo | null;
  psychedelics: PsychedelicUse | null;
  /** The person's estimate of how many times they've used psychedelics: a whole number, 1 or more. */
  psychedelic_uses: number | null;
  /** Which psychedelics they've used, in their own words; only when psychedelics is "yes". */
  psychedelics_used: string | null;
  /** Whether they take any medications, if they said. */
  takes_medication: YesNo | null;
  /** Which ones, in their own words; only when takes_medication is "yes". */
  medications: string | null;
  notes: string | null;
  /** Where they found the test, if they said. */
  found_via: FoundVia | null;
  /** Their own words when found_via is "other". */
  found_via_other: string | null;
}

/** What was chosen at step 1, before any session exists. */
export type ContributionChoice = { contribute: false } | { contribute: true; answers: ContributionAnswers };

/** A session's own copy of the choice, with its sending state. */
export type SessionContribution =
  | { contribute: false }
  | {
      contribute: true;
      submission_id: string;
      sent_at: string | null;
      answers: ContributionAnswers;
      /** In flight now. Not exported. */
      sending?: boolean;
      /** The last attempt failed. Not exported. */
      failed?: boolean;
    };

// ----- Session -----

export interface Session {
  page: string;
  /** TEST_VERSION when the session ran. */
  testVersion: number;
  seed: number;
  startedAt: string;
  finishedAt: string | null;
  endedEarly: boolean;
  settings: Settings;
  calibration: Calibration | null;
  distance: Distance | null;
  frameMs: number | null;
  refreshHz: number | null;
  display: Display | null;
  /** Trials started, including ones restarted after a pause. Seeds each trial. */
  attempts: number;
  env: Environment;
  tasks: Partial<Record<TaskName, TaskRecord>>;
  trials: Trial[];
  results: Results | null;
  contribution: SessionContribution | null;
}
