// A run's numbers, from a session or a stored row, and the sentence about what they say about each
// other. Used by the tiles on both results pages (components/RunSummary.tsx) and by the PDF.
import { fmt } from "./format";
import type { HistoryEntry } from "./history";
import type { TaskName, TaskResult } from "./types";
import { text } from "../text";

const t = text.charts.summary;

export interface TaskNumbers {
  status: TaskResult["status"];
  threshold_pct: number | null;
  sensitivity: number | null;
  /** Null where it isn't known: a stored row without its staircase. */
  staircase_trials: number | null;
}

/** What the tiles and sentence need. A session's `Results` is one. */
export interface RunNumbers {
  motion: TaskNumbers | null;
  form: TaskNumbers | null;
  motion_minus_form: { sensitivity: number; threshold_ratio: number } | null;
}

/** A stored session's numbers: sensitivity is 1 ÷ threshold, scored trials are its staircase's points. */
export function runNumbers(e: HistoryEntry): RunNumbers {
  const task = (t: TaskName): TaskNumbers | null => {
    const thr = e.values[t === "motion" ? "motion_threshold_pct" : "form_threshold_pct"];
    const status = e.run ? e.run.status[t] : thr != null ? "complete" : "not reached";
    if (!status) return null;
    return { status, threshold_pct: thr, sensitivity: thr ? 1 / thr : null, staircase_trials: e.staircases ? e.staircases[t].length : null };
  };
  const m = e.values.motion_threshold_pct, f = e.values.form_threshold_pct, d = e.values.motion_minus_form;
  return { motion: task("motion"), form: task("form"), motion_minus_form: d != null && m && f ? { sensitivity: d, threshold_ratio: m / f } : null };
}

/** This run in words: what the person's own two numbers say about each other, and nothing more. */
export function interpretation(R: RunNumbers): string {
  const m = R.motion?.threshold_pct, f = R.form?.threshold_pct;
  if (m == null || f == null) return t.noDiff;
  if (Math.abs(m - f) / ((m + f) / 2) < 0.1) return t.same(fmt.pct(m), fmt.pct(f));
  if (m < f) return t.motionFewer(fmt.pct(m), fmt.pct(f));
  return t.formFewer(fmt.pct(m), fmt.pct(f));
}
