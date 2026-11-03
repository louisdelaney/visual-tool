// The last step: thresholds, staircase charts, session details, the data, and whether it was sent.
import { useState } from "react";
import { Core, PROTOCOL, PROTOCOLS } from "../core";
import type { Results, Session } from "../app/types";
import { TASK_ORDER, TEST_TYPE_LABEL } from "../app/protocol";
import { fmt } from "../app/format";
import { show, showHistory } from "../app/flow";
import { pageHref } from "../app/address";
import { removeContribution, sendContribution } from "../app/contribution";
import { downloadFile, exportObject, fileBase, sessionJSON, summaryJSON } from "../app/export";
import { StaircaseChart, StaircaseKey } from "../components/StaircaseChart";
import { runInfoOf, staircasePoints } from "../app/history";
import { reportSession, savePDF } from "../app/report";
import { GroupComparison, useGroupStats } from "../components/GroupComparison";
import { RunNotes, SessionNotes } from "../components/RunNotes";
import { RunSummary } from "../components/RunSummary";
import { SaveMenu } from "../components/SaveMenu";
import { FunNotice } from "../components/FunNotice";
import { ResultsExplained } from "../components/ResultsExplained";

/** Label and value rows for the Session list. */
function sessionRows(s: Session, R: Results): [string, string][] {
  const c = s.calibration, dist = s.distance;
  const rows: [string, string][] = [];
  rows.push(["Test version", String(s.testVersion)]);
  const run = PROTOCOLS[s.testType].run;
  rows.push(["Test", `${TEST_TYPE_LABEL[s.testType]}: each task stops at ${run.stopReversals} reversals, threshold from the last ${run.meanOfLast}`]);
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
  if (s.display) rows.push(["Window", s.display.fullscreen ? "Full screen" : `Not full screen, ${Math.round(100 * s.display.viewport[0] / Math.max(1, window.screen.width))}% of the screen's width`]);
  rows.push(["Display refresh", s.refreshHz ? `${fmt.fixed(s.refreshHz, 0)} Hz, median frame ${fmt.fixed(s.frameMs, 1)} ms` : "–"]);
  const dropped = (["motion", "form"] as const).map(task => {
    const tt = s.trials.filter(t => t.task === task && t.frames != null && t.dropped_frames != null);
    if (!tt.length) return null;
    const fr = tt.reduce((a, t) => a + (t.frames ?? 0), 0), dr = tt.reduce((a, t) => a + (t.dropped_frames ?? 0), 0);
    return `${task === "form" ? "form flashes" : "motion"} ${fmt.int(dr)} of ${fmt.int(fr)} (${fmt.fixed(100 * dr / Math.max(1, fr), 1)}%)`;
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
  // Not contributing, or sent: the anonymity note above already says so.
  if (!c.contribute) return "";
  if (c.removal === "removed") return "Removed from the database. It's already out of the group figures, and it leaves the public download at its next daily refresh.";
  if (c.sent_at) return "";
  if (c.sending) return "Sending your results…";
  if (c.failed) return "Couldn't send your results. Check your connection and try again.";
  return "Sending isn't set up on this copy of the test yet, so nothing was sent. Your answers are included when you save the session as JSON.";
}

/** What happens to these results, carrying on the "just for fun" line: they're anonymous. The Privacy and risks page has the detail. */
function AnonymityNote({ session: s }: { session: Session }) {
  const c = s.contribution;
  const privacy = <a href={pageHref("privacy")} onClick={e => { e.preventDefault(); show("privacy"); }}>Privacy and risks</a>;
  if (!c?.contribute) {
    return <span id="anonymity-note">Nothing was sent: these results stay in this browser tab, and nothing that identifies you is collected. More in {privacy}.</span>;
  }
  return (
    <span id="anonymity-note">
      Your results are anonymous. Nothing that identifies you, such as your name, email address or IP address, is collected or stored. More in {privacy}.
    </span>
  );
}

/**
 * The Results page's notice, shown in the header above the steps: "just for fun", carrying on with
 * what happens to the person's data, then anything about sending it.
 */
export function ResultsNotice({ session: s }: { session: Session }) {
  const note = contributionNote(s);
  const failed = !!(s.contribution?.contribute && s.contribution.failed && !s.contribution.sending);
  const failureId = failed && s.contribution?.contribute ? s.contribution.failure_id : undefined;
  return (
    <FunNotice more={<AnonymityNote session={s} />}>
      <section id="your-data" aria-label="Sending your results">
        {note && <p className="hint" id="contrib-note">{note}</p>}
        {failureId && <p className="hint" id="contrib-failure-id">Reference: {failureId}. You can quote it if you report a problem.</p>}
        {failed && <div className="actions"><button type="button" className="btn secondary" id="contrib-retry" onClick={() => void sendContribution(s)}>Try sending again</button></div>}
        <RemoveContribution session={s} />
      </section>
    </FunNotice>
  );
}

/** Takes a sent session back out of the database. Only this page has its token, so it's offered here and nowhere else. */
function RemoveContribution({ session: s }: { session: Session }) {
  const [asking, setAsking] = useState(false);
  const c = s.contribution;
  if (!c?.contribute || !c.sent_at || !c.delete_token || c.removal === "removed") return null;
  const busy = c.removal === "removing";
  return (
    <div id="remove">
      {asking ? (
        <>
          <p className="hint">Remove this session from the database? This can't be undone.</p>
          <div className="actions">
            <button type="button" className="btn secondary" id="remove-confirm" disabled={busy} onClick={() => void removeContribution(s)}>{busy ? "Removing…" : "Remove it"}</button>
            <button type="button" className="btn secondary" id="remove-cancel" disabled={busy} onClick={() => setAsking(false)}>Keep it</button>
          </div>
        </>
      ) : (
        <>
          <p className="hint">Changed your mind, or something got in the way during the test? You can remove this session from the database until you run the test again or close this tab.</p>
          <div className="actions"><button type="button" className="btn secondary" id="remove-start" onClick={() => setAsking(true)}>Remove from the database</button></div>
        </>
      )}
      {c.removal === "failed" && <p className="hint" id="remove-failed" role="status">Couldn't remove it. Check your connection and try again.{c.failure_id ? ` Reference: ${c.failure_id}.` : ""}</p>}
    </div>
  );
}

interface ResultsPageProps {
  session: Session | null;
}

export function ResultsPage({ session }: ResultsPageProps) {
  return session?.results ? <SessionResults session={session} /> : null;
}

// Split out so the groups hook always has a session.
function SessionResults({ session: s }: { session: Session }) {
  const groups = useGroupStats(s);
  if (!s.results) return null;
  const R = s.results;
  const tasks = TASK_ORDER.filter(t => s.tasks[t]);

  /** Saves one of the two files and returns its name, for the save menu. */
  const save = (kind: "summary" | "full"): string => {
    const filename = `${fileBase(s)}${kind === "summary" ? "-summary" : ""}.json`;
    downloadFile(filename, kind === "summary" ? summaryJSON(s) : sessionJSON(s), "application/json");
    return filename;
  };

  /** The PDF summary: what this page shows, beside the groups as loaded here. */
  const savePdf = (): Promise<string> => {
    const one = reportSession(s, groups.available ? groups.load : null)!;
    return savePDF(`${fileBase(s)}-summary.pdf`, { pseudonym, sessions: [one] });
  };

  // Back returns here with everything, but a reload or a closed tab loses this run: ask first.
  const openHistory = (p: string): void => {
    if (window.confirm("Leave this page to see all your results? Back brings you here again, but if the page is reloaded or closed, these results are gone unless you've saved them.")) showHistory(p);
  };

  const pseudonym = s.contribution?.contribute ? s.contribution.answers.pseudonym : null;
  const sent = !!(s.contribution?.contribute && s.contribution.sent_at);

  return (
    <section className="view view-stack" data-view="results" aria-labelledby="results-h">
      <div className="panel">
        <ResultsExplained groups={groups.available} thresholdCharts />
      </div>
      <div className="panel save-card">
        <h2 id="results-h">Results{s.testType === "quick" && <> <span className="pill type-pill" id="type-pill">{TEST_TYPE_LABEL.quick}</span></>}</h2>
        <SaveMenu id="save-menu" options={[
          { id: "save-pdf", label: "Save summary (PDF)", description: "These results, charts and the groups as they are now, to read or print.", pending: "Making the PDF…", save: savePdf },
          { id: "save-summary", label: "Save summary (JSON)", description: "Your pseudonym, answers, results and the points on the staircase charts.", save: () => save("summary") },
          { id: "save-json", label: "Save full data (JSON)", description: `Everything recorded, exactly as ${s.contribution?.contribute ? "it's" : "it would be"} sent to the database.`, save: () => save("full") },
        ]} />
        {s.testType === "quick" && <p className="hint" id="test-type-note">This was the quick test: a shorter run, so these results are less precise than a full test's would be. They're only ever shown beside other quick-test results{s.contribution?.contribute ? ", and they're sent labelled as quick" : ""}.</p>}
        {pseudonym && (
          <header className="as-pseudonym" id="pseudonym-note">
            <p>
              {sent ? (
                <button type="button" className="pseudonym pseudonym-link" id="history-link" onClick={() => openHistory(pseudonym)}>
                  <span className="visually-hidden">See all results for </span>{pseudonym}
                </button>
              ) : (
                <span className="pseudonym"><span className="visually-hidden">Your pseudonym: </span>{pseudonym}</span>
              )}
            </p>
            <p className="hint">{sent ? "Your results are saved under this pseudonym. Select it to see all your results." : "Your pseudonym. Use it to find these results again on the Results by pseudonym page, once they've been sent."}</p>
          </header>
        )}
        <RunSummary results={R} ids />
        <RunNotes run={runInfoOf(exportObject(s))} taken={false} />
        {s.contribution?.contribute && <SessionNotes medications={s.contribution.answers.medications} notes={s.contribution.answers.notes} />}
      </div>
      <GroupComparison session={s} groups={groups} />
      <div className="panel">
        <h3>Staircases</h3>
        <div className="charts" id="charts">
          {tasks.length ? tasks.map(t => (
            <StaircaseChart key={t} task={t} points={staircasePoints(s.tasks[t]!.trials, t)} threshold={R[t]?.threshold_pct ?? null}
              subtitle="Coherence (%) on each scored trial, log scale" />
          )) : <p className="hint">No trials were completed.</p>}
        </div>
        <StaircaseKey />
      </div>
      <details className="panel more-stats" id="session-details">
        <summary><h3>Session</h3></summary>
        <dl className="meta" id="meta">
          {sessionRows(s, R).map(([k, v]) => [<dt key={`${k}-dt`}>{k}</dt>, <dd key={`${k}-dd`}>{v}</dd>])}
        </dl>
      </details>
    </section>
  );
}
