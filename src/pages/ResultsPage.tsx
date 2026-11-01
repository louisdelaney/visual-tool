// The last step: thresholds, staircase charts, session details, the data, and whether it was sent.
import { useState } from "react";
import { Core, PROTOCOL } from "../core";
import type { Results, Session, TaskName, TaskResult, Trial } from "../app/types";
import { TASK_ORDER } from "../app/protocol";
import { fmt } from "../app/format";
import { getState, setState } from "../app/store";
import { show, showHistory } from "../app/flow";
import { sendContribution } from "../app/contribution";
import { downloadFile, fileBase, sessionJSON, summaryJSON } from "../app/export";
import { StaircaseChart, StaircaseKey } from "../components/StaircaseChart";
import { staircasePoints } from "../app/history";
import { GroupComparison } from "../components/GroupComparison";
import { FunNotice } from "../components/FunNotice";

function Tile({ task, result }: { task: TaskName; result: TaskResult | null }) {
  const name = task === "motion" ? "Motion" : "Form";
  const head = <span className="label"><span className={`key key-${task}`} />{name} threshold</span>;
  if (!result) return <div className="tile">{head}<span className="value">–</span><span className="sub">Not run</span></div>;
  return (
    <div className="tile">
      {head}
      <span className="value">{fmt.pct(result.threshold_pct)}</span>
      <span className="sub">sensitivity {fmt.fixed(result.sensitivity, 3)} · {result.staircase_trials} scored trials</span>
      {result.status !== "complete" && <span className="pill"><span className="pip" aria-hidden="true" />{result.status === "incomplete" ? "Ended early" : "No threshold"}</span>}
    </div>
  );
}

function interpretation(R: Results): string {
  const m = R.motion?.threshold_pct, f = R.form?.threshold_pct;
  let text = "";
  if (m != null && f != null) {
    const rel = Math.abs(m - f) / ((m + f) / 2) < 0.1 ? "about the same as" : m < f ? "lower than" : "higher than";
    text += `Your motion threshold was ${rel} your form threshold (${fmt.pct(m)} against ${fmt.pct(f)}). A lower threshold means fewer organised elements were needed to find the target. `;
  } else {
    text += "At least one task ended before a threshold could be estimated. ";
  }
  text += "Both thresholds are the coherence that gives about 79% correct. ";
  text += "Sensitivity is 1 ÷ threshold in percent, so a 10% threshold is a sensitivity of 0.1.";
  const missed = [R.motion, R.form].reduce((a, r) => a + (r ? r.catch_total - r.catch_correct : 0), 0);
  if (missed > 0) text += ` ${missed === 1 ? "One" : missed} of the easy check trials ${missed === 1 ? "was" : "were"} answered wrongly. That can mean lapses of attention or a display problem, so treat these thresholds with caution.`;
  return text;
}

/** Label and value rows for the Session list. */
function sessionRows(s: Session, R: Results): [string, string][] {
  const c = s.calibration, dist = s.distance;
  const rows: [string, string][] = [];
  rows.push(["Test version", String(s.testVersion)]);
  rows.push(["Started", fmt.time(s.startedAt)]);
  rows.push(["Screen scale", c ? `${fmt.fixed(c.pxPerMm, 3)} px per mm, card ${fmt.fixed(c.cardPx, 1)} px wide` : "–"]);
  if (dist) {
    let how = "entered by hand";
    if (dist.method === "blind-spot" && dist.readings.length) how = `blind spot, ${dist.readings.length} readings ${Math.min(...dist.readings).toFixed(0)}–${Math.max(...dist.readings).toFixed(0)} cm`;
    rows.push(["Viewing distance", `${fmt.fixed(dist.cm, 1)} cm, ${how}`]);
  }
  const scored = s.trials.filter(t => Number.isFinite(t.px_per_deg) && Number.isFinite(t.scale));
  if (scored.length) {
    const ppds = scored.map(t => t.px_per_deg), lo = Math.min(...ppds), hi = Math.max(...ppds);
    const minScale = Math.min(...scored.map(t => t.scale));
    const ppdText = hi - lo < 0.05 ? fmt.fixed(lo, 1) : `${fmt.fixed(lo, 1)}–${fmt.fixed(hi, 1)}`;
    rows.push(["Pixels per degree", `${ppdText}${minScale < 0.999 ? `, stimuli shrunk to ${Math.round(minScale * 100)}% of protocol size to fit` : ", stimuli at full protocol size"}`]);
  }
  if (s.display) rows.push(["Window", s.display.fullscreen ? "Full screen" : `Not full screen, ${Math.round(100 * s.display.viewport[0] / Math.max(1, s.env.screen[0]))}% of the screen's width`]);
  rows.push(["Display refresh", s.refreshHz ? `${fmt.fixed(s.refreshHz, 0)} Hz, median frame ${fmt.fixed(s.frameMs, 1)} ms` : "–"]);
  const dropped = (["motion", "form"] as const).map(task => {
    const tt = s.trials.filter(t => t.task === task && t.frames != null && t.dropped_frames != null);
    if (!tt.length) return null;
    const fr = tt.reduce((a, t) => a + (t.frames ?? 0), 0), dr = tt.reduce((a, t) => a + (t.dropped_frames ?? 0), 0);
    return `${task === "form" ? "spiral flashes" : "motion"} ${fmt.int(dr)} of ${fmt.int(fr)} (${fmt.fixed(100 * dr / Math.max(1, fr), 1)}%)`;
  }).filter((v): v is string => v != null);
  if (dropped.length) rows.push(["Dropped frames", dropped.join(", ")]);
  const catchText = (["motion", "form"] as const).flatMap(t => { const r = R[t]; return r && r.catch_total ? [`${t} ${r.catch_correct} of ${r.catch_total}`] : []; }).join(", ");
  if (catchText) rows.push(["Easy check trials correct", catchText]);
  rows.push(["Motion display", `${PROTOCOL.motion.briefMs} ms flash`]);
  const fl = s.trials.flatMap(t => [t.flash1_ms, t.flash2_ms]).filter((v): v is number => v != null && Number.isFinite(v));
  if (fl.length) rows.push(["Flash length", `median ${fmt.fixed(Core.median(fl), 0)} ms, range ${fmt.fixed(Math.min(...fl), 0)}–${fmt.fixed(Math.max(...fl), 0)} ms (target 200 ms)`]);
  if (s.endedEarly) rows.push(["Ended", "Early, at your request"]);
  rows.push(["Browser", s.env.browser]);
  return rows;
}

function contributionNote(s: Session): string {
  const c = s.contribution;
  if (!c) return "";
  if (!c.contribute) return "You chose not to contribute, so nothing was sent.";
  if (c.sent_at) return `Sent anonymously. Thank you. Reference: ${c.submission_id}.`;
  if (c.sending) return "Sending your results…";
  if (c.failed) return "Couldn't send your results. Check your connection and try again.";
  return "Sending isn't set up on this copy of the test yet, so nothing was sent. Your answers are included when you save the session as JSON.";
}

const TRIAL_COLUMNS: [string, (t: Trial) => string | number][] = [
  ["Task", t => t.task], ["Trial", t => t.trial], ["Phase", t => t.phase], ["Coherence", t => fmt.pct(t.effective_level_pct)],
  ["Target", t => t.target], ["Answer", t => t.response], ["Correct", t => (t.correct ? "yes" : "no")], ["Time", t => `${t.rt_ms} ms`], ["Reversal", t => (t.reversal ? "yes" : "")],
];

interface ResultsPageProps {
  session: Session | null;
}

export function ResultsPage({ session: s }: ResultsPageProps) {
  const [dataStatus, setDataStatus] = useState("");
  const [raw, setRaw] = useState("");
  if (!s || !s.results) return null;
  const R = s.results;
  const tasks = TASK_ORDER.filter(t => s.tasks[t]);

  const save = (kind: "summary" | "full"): void => {
    const filename = `${fileBase(s)}${kind === "summary" ? "-summary" : ""}.json`;
    downloadFile(filename, kind === "summary" ? summaryJSON(s) : sessionJSON(s), "application/json");
    setDataStatus(`Saved ${filename}.`);
  };

  const again = (): void => {
    setState({ session: null });
    show(getState().calib ? "distance" : "screen");
  };

  const d = R.motion_minus_form;
  const note = contributionNote(s);
  const failed = !!(s.contribution?.contribute && s.contribution.failed && !s.contribution.sending);
  const failureId = failed && s.contribution?.contribute ? s.contribution.failure_id : undefined;
  const pseudonym = s.contribution?.contribute ? s.contribution.answers.pseudonym : null;

  return (
    <section className="view view-stack" data-view="results" aria-labelledby="results-h">
      <FunNotice />
      <div className="panel">
        <h2 id="results-h">Results</h2>
        {pseudonym && (
          <p className="pseudonym-note" id="pseudonym-note">
            Your pseudonym is <strong>{pseudonym}</strong>. Use it to find these results again later{s.contribution?.contribute && s.contribution.sent_at
              ? <>: <button type="button" className="linkish" id="history-link" onClick={() => showHistory(pseudonym)}>see all results for {pseudonym}</button>.</>
              : " on the User results page, once they've been sent."}
          </p>
        )}
        <div className="tiles" id="tiles">
          <Tile task="motion" result={R.motion} />
          <Tile task="form" result={R.form} />
          <div className="tile">
            <span className="label">Motion minus form sensitivity</span>
            <span className="value">{d ? fmt.signed(d.sensitivity, 3) : "–"}</span>
            <span className="sub">{d ? `motion ÷ form threshold ${fmt.fixed(d.threshold_ratio, 2)}` : "Needs both thresholds"}</span>
          </div>
        </div>
        <p className="interp" id="interpretation">{interpretation(R)}</p>
      </div>
      <GroupComparison session={s} />
      <div className="panel">
        <h3>Staircases</h3>
        <div className="charts" id="charts">
          {tasks.length ? tasks.map(t => (
            <StaircaseChart key={t} task={t} points={staircasePoints(s.tasks[t]!.trials, t)} threshold={R[t]?.threshold_pct ?? null}
              subtitle="Coherence (%) on each scored trial, log scale" />
          )) : <p className="hint">No trials were completed.</p>}
        </div>
        <StaircaseKey />
        <hr className="section-rule" />
        <h3>Session</h3>
        <dl className="meta" id="meta">
          {sessionRows(s, R).map(([k, v]) => [<dt key={`${k}-dt`}>{k}</dt>, <dd key={`${k}-dd`}>{v}</dd>])}
        </dl>
        <hr className="section-rule" />
        <h3>Your data</h3>
        <p className="hint">The summary has your pseudonym, your answers, your results and the points on the staircase charts.</p>
        <div className="actions">
          <button type="button" className="btn" id="save-summary" onClick={() => save("summary")}>Save summary</button>
        </div>
        <p className="status" id="data-status" role="status" aria-live="polite">{dataStatus}</p>
        {note && <p className="hint" id="contrib-note">{note}</p>}
        {failureId && <p className="hint" id="contrib-failure-id">Reference: {failureId}. You can quote it if you report a problem.</p>}
        {failed && <div className="actions"><button type="button" className="btn secondary" id="contrib-retry" onClick={() => void sendContribution(s)}>Try sending again</button></div>}
        <details id="raw" onToggle={e => { if (e.currentTarget.open) setRaw(sessionJSON(s)); }}>
          <summary>Show the raw data</summary>
          <p className="hint">Everything recorded, exactly as {s.contribution?.contribute ? "it's" : "it would be"} sent to the database.</p>
          <div className="actions">
            <button type="button" className="btn secondary" id="save-json" onClick={() => save("full")}>Save full data (JSON)</button>
          </div>
          <textarea id="raw-json" readOnly rows={10} aria-label="Session data as JSON" value={raw} />
        </details>
        <details>
          <summary>Trial table</summary>
          <div className="table-wrap">
            <table id="trial-table">
              <thead><tr>{TRIAL_COLUMNS.map(([h]) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>{s.trials.map((t, i) => <tr key={i}>{TRIAL_COLUMNS.map(([h, get]) => <td key={h}>{get(t)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
      </div>
      <div className="actions"><button type="button" className="btn" id="again" onClick={again}>Run the test again</button></div>
    </section>
  );
}
