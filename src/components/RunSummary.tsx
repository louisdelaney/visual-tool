// A run's numbers and what they say about each other: a tile per task and one for motion − form,
// then a sentence. On both results pages: the Results page passes its session's results, the User
// results page what it works out from a stored row (runNumbers).
import { fmt } from "../app/format";
import type { HistoryEntry } from "../app/history";
import type { TaskName, TaskResult } from "../app/types";

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

function Tile({ task, result }: { task: TaskName; result: TaskNumbers | null }) {
  const name = task === "motion" ? "Motion" : "Form";
  const head = <span className="label"><span className={`key key-${task}`} />{name} threshold</span>;
  if (!result) return <div className="tile">{head}<span className="value">–</span><span className="sub">Not run</span></div>;
  return (
    <div className="tile">
      {head}
      <span className="value">{fmt.pct(result.threshold_pct)}</span>
      <span className="sub">sensitivity {fmt.fixed(result.sensitivity, 3)}{result.staircase_trials != null ? ` · ${result.staircase_trials} scored trials` : ""}</span>
      {result.status !== "complete" && <span className="pill"><span className="pip" aria-hidden="true" />{result.status === "incomplete" ? "Ended early" : "No threshold"}</span>}
    </div>
  );
}

/** This run in words: what the person's own two numbers say about each other, and nothing more. */
export function interpretation(R: RunNumbers): string {
  const m = R.motion?.threshold_pct, f = R.form?.threshold_pct;
  if (m == null || f == null) return "At least one task ended before a threshold could be estimated, so there's no motion − form value.";
  if (Math.abs(m - f) / ((m + f) / 2) < 0.1) return `In this run, about the same share of organised dots was needed to see the motion (${fmt.pct(m)}) and the starburst (${fmt.pct(f)}).`;
  if (m < f) return `In this run, fewer organised dots were needed to see the motion (${fmt.pct(m)}) than the starburst (${fmt.pct(f)}), so motion − form is above zero.`;
  return `In this run, fewer organised dots were needed to see the starburst (${fmt.pct(f)}) than the motion (${fmt.pct(m)}), so motion − form is below zero.`;
}

/** The tiles and the sentence. `ids` gives them the Results page's element ids (one run per page there). */
export function RunSummary({ results: R, ids = false }: { results: RunNumbers; ids?: boolean }) {
  const d = R.motion_minus_form;
  return (
    <>
      <div className="tiles" id={ids ? "tiles" : undefined}>
        <Tile task="motion" result={R.motion} />
        <Tile task="form" result={R.form} />
        <div className="tile">
          <span className="label">Motion minus form sensitivity</span>
          <span className="value">{d ? fmt.signed(d.sensitivity, 3) : "–"}</span>
          <span className="sub">{d ? `motion ÷ form threshold ${fmt.fixed(d.threshold_ratio, 2)}` : "Needs both thresholds"}</span>
        </div>
      </div>
      <p id={ids ? "interpretation" : undefined}>{interpretation(R)}</p>
    </>
  );
}
