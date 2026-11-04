// A run's numbers and what they say about each other: a tile per task and one for motion − form,
// then a sentence. On both results pages: the Results page passes its session's results, the User
// results page what it works out from a stored row (runNumbers in app/runNumbers.ts).
import { fmt } from "../app/format";
import { interpretation, type RunNumbers, type TaskNumbers } from "../app/runNumbers";
import type { TaskName } from "../app/types";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.charts.summary;

function Tile({ task, result }: { task: TaskName; result: TaskNumbers | null }) {
  const head = <span className="label"><span className={`key key-${task}`} />{t.threshold(text.charts.taskName[task])}</span>;
  if (!result) return <div className="tile">{head}<span className="value">{text.common.none}</span><span className="sub">{t.notRun}</span></div>;
  return (
    <div className="tile">
      {head}
      <span className="value">{fmt.pct(result.threshold_pct)}</span>
      <span className="sub">{t.sensitivity(fmt.fixed(result.sensitivity, 3))}{result.staircase_trials != null ? t.scoredTrials(result.staircase_trials) : ""}</span>
      {result.status !== "complete" && <span className="pill"><span className="pip" aria-hidden="true" />{result.status === "incomplete" ? t.endedEarly : t.noThreshold}</span>}
    </div>
  );
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
          <span className="label">{t.diff}</span>
          <span className="value">{d ? fmt.signed(d.sensitivity, 3) : text.common.none}</span>
          <span className="sub">{d ? t.ratio(fmt.fixed(d.threshold_ratio, 2)) : t.needsBoth}</span>
        </div>
      </div>
      <p id={ids ? "interpretation" : undefined}><Rich text={interpretation(R)} /></p>
    </>
  );
}
