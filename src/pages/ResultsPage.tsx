// The last step: thresholds, staircase charts, session details, the data, and whether it was sent.
import { useState, type ReactNode } from "react";
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
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.results, rt = t.rows;

/** Label and value rows for the Session list. */
function sessionRows(s: Session, R: Results): [string, string][] {
  const c = s.calibration, dist = s.distance;
  const rows: [string, string][] = [];
  rows.push([rt.testVersion, String(s.testVersion)]);
  const run = PROTOCOLS[s.testType].run;
  rows.push([rt.test, rt.testValue(TEST_TYPE_LABEL[s.testType], run.stopReversals, run.meanOfLast)]);
  rows.push([rt.started, fmt.time(s.startedAt)]);
  rows.push([rt.screenScale, c ? rt.screenScaleValue(fmt.fixed(c.pxPerMm, 3), fmt.fixed(c.cardPx, 1)) : text.common.none]);
  if (dist) {
    let how = rt.distanceByHand;
    if (dist.method === "blind-spot" && dist.readings.length) how = rt.distanceBlindSpot(dist.readings.length, Math.min(...dist.readings).toFixed(0), Math.max(...dist.readings).toFixed(0));
    rows.push([rt.viewingDistance, rt.viewingDistanceValue(fmt.fixed(dist.cm, 1), how)]);
  }
  const scored = s.trials.filter(t => Number.isFinite(t.px_per_deg) && Number.isFinite(t.scale));
  if (scored.length) {
    const ppds = scored.map(t => t.px_per_deg), lo = Math.min(...ppds), hi = Math.max(...ppds);
    const minScale = Math.min(...scored.map(t => t.scale));
    const ppdText = hi - lo < 0.05 ? fmt.fixed(lo, 1) : rt.pixelsPerDegreeRange(fmt.fixed(lo, 1), fmt.fixed(hi, 1));
    rows.push([rt.pixelsPerDegree, rt.pixelsPerDegreeValue(ppdText, minScale < 0.999 ? Math.round(minScale * 100) : null)]);
  }
  if (s.display) rows.push([rt.window, s.display.fullscreen ? rt.fullScreen : rt.notFullScreen(Math.round(100 * s.display.viewport[0] / Math.max(1, window.screen.width)))]);
  rows.push([rt.displayRefresh, s.refreshHz ? rt.displayRefreshValue(fmt.fixed(s.refreshHz, 0), fmt.fixed(s.frameMs, 1)) : text.common.none]);
  const dropped = (["motion", "form"] as const).map(task => {
    const tt = s.trials.filter(t => t.task === task && t.frames != null && t.dropped_frames != null);
    if (!tt.length) return null;
    const fr = tt.reduce((a, t) => a + (t.frames ?? 0), 0), dr = tt.reduce((a, t) => a + (t.dropped_frames ?? 0), 0);
    return rt.droppedValue(rt.droppedTask[task], fmt.int(dr), fmt.int(fr), fmt.fixed(100 * dr / Math.max(1, fr), 1));
  }).filter((v): v is string => v != null);
  if (dropped.length) rows.push([rt.droppedFrames, dropped.join(", ")]);
  const catchText = (["motion", "form"] as const).flatMap(t => { const r = R[t]; return r && r.catch_total ? [rt.easyChecksValue(rt.easyCheckTask[t], r.catch_correct, r.catch_total)] : []; }).join(", ");
  if (catchText) rows.push([rt.easyChecks, catchText]);
  rows.push([rt.motionDisplay, rt.motionDisplayValue(PROTOCOL.motion.briefMs)]);
  const fl = s.trials.flatMap(t => [t.flash1_ms, t.flash2_ms]).filter((v): v is number => v != null && Number.isFinite(v));
  if (fl.length) rows.push([rt.flashLength, rt.flashLengthValue(fmt.fixed(Core.median(fl), 0), fmt.fixed(Math.min(...fl), 0), fmt.fixed(Math.max(...fl), 0))]);
  if (s.endedEarly) rows.push([rt.ended, rt.endedEarly]);
  rows.push([rt.browser, s.env.browser]);
  return rows;
}

function contributionNote(s: Session): string {
  const c = s.contribution;
  if (!c) return "";
  // Not contributing, or sent: the anonymity note above already says so.
  if (!c.contribute) return "";
  if (c.removal === "removed") return t.removed;
  if (c.sent_at) return "";
  if (c.sending) return t.sending;
  if (c.failed) return t.sendFailed;
  return t.sendingNotSetUp;
}

/** What happens to these results, carrying on the "just for fun" line: they're anonymous. The Privacy and risks page has the detail. */
function AnonymityNote({ session: s }: { session: Session }) {
  const c = s.contribution;
  const tags = { "privacy-link": (children: ReactNode) => <a href={pageHref("privacy")} onClick={e => { e.preventDefault(); show("privacy"); }}>{children}</a> };
  return <span id="anonymity-note"><Rich text={c?.contribute ? t.anonymousNote : t.notSentNote} tags={tags} /></span>;
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
      <section id="your-data" aria-label={t.sendingLabel}>
        {note && <p className="hint" id="contrib-note"><Rich text={note} /></p>}
        {failureId && <p className="hint" id="contrib-failure-id">{t.failureReference(failureId)}</p>}
        {failed && <div className="actions"><button type="button" className="btn secondary" id="contrib-retry" onClick={() => void sendContribution(s)}>{t.trySendingAgain}</button></div>}
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
          <p className="hint">{t.removeQuestion}</p>
          <div className="actions">
            <button type="button" className="btn secondary" id="remove-confirm" disabled={busy} onClick={() => void removeContribution(s)}>{busy ? t.removing : t.removeIt}</button>
            <button type="button" className="btn secondary" id="remove-cancel" disabled={busy} onClick={() => setAsking(false)}>{t.keepIt}</button>
          </div>
        </>
      ) : (
        <>
          <p className="hint"><Rich text={t.removeOffer} /></p>
          <div className="actions"><button type="button" className="btn secondary" id="remove-start" onClick={() => setAsking(true)}>{t.removeStart}</button></div>
        </>
      )}
      {c.removal === "failed" && <p className="hint" id="remove-failed" role="status">{t.removeFailed(c.failure_id)}</p>}
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
    if (window.confirm(t.leaveForHistory)) showHistory(p);
  };

  const pseudonym = s.contribution?.contribute ? s.contribution.answers.pseudonym : null;
  const sent = !!(s.contribution?.contribute && s.contribution.sent_at);

  return (
    <section className="view view-stack" data-view="results" aria-labelledby="results-h">
      <div className="panel">
        <ResultsExplained groups={groups.available} thresholdCharts />
      </div>
      <div className="panel save-card">
        <h2 id="results-h">{t.heading}{s.testType === "quick" && <> <span className="pill type-pill" id="type-pill">{TEST_TYPE_LABEL.quick}</span></>}</h2>
        <SaveMenu id="save-menu" options={[
          { id: "save-pdf", label: t.savePdf.label, description: t.savePdf.description, pending: t.savePdf.pending, save: savePdf },
          { id: "save-summary", label: t.saveSummary.label, description: t.saveSummary.description, save: () => save("summary") },
          { id: "save-json", label: t.saveFull.label, description: t.saveFull.description(!!s.contribution?.contribute), save: () => save("full") },
        ]} />
        {s.testType === "quick" && <p className="hint" id="test-type-note"><Rich text={t.quickNote(!!s.contribution?.contribute)} /></p>}
        {pseudonym && (
          <header className="as-pseudonym" id="pseudonym-note">
            <p>
              {sent ? (
                <button type="button" className="pseudonym pseudonym-link" id="history-link" onClick={() => openHistory(pseudonym)}>
                  <span className="visually-hidden">{t.seeAllFor}</span>{pseudonym}
                </button>
              ) : (
                <span className="pseudonym"><span className="visually-hidden">{t.yourPseudonym}</span>{pseudonym}</span>
              )}
            </p>
            <p className="hint"><Rich text={sent ? t.savedUnderPseudonym : t.findAgainPseudonym} /></p>
          </header>
        )}
        <RunSummary results={R} ids />
        <RunNotes run={runInfoOf(exportObject(s))} taken={false} />
        {s.contribution?.contribute && <SessionNotes medications={s.contribution.answers.medications} notes={s.contribution.answers.notes} />}
      </div>
      <GroupComparison session={s} groups={groups} />
      <div className="panel">
        <h3>{t.staircasesHeading}</h3>
        <div className="charts" id="charts">
          {tasks.length ? tasks.map(task => (
            <StaircaseChart key={task} task={task} points={staircasePoints(s.tasks[task]!.trials, task)} threshold={R[task]?.threshold_pct ?? null}
              subtitle={t.staircaseSubtitle} />
          )) : <p className="hint">{t.noTrials}</p>}
        </div>
        <StaircaseKey />
      </div>
      <details className="panel more-stats" id="session-details">
        <summary><h3>{t.sessionHeading}</h3></summary>
        <dl className="meta" id="meta">
          {sessionRows(s, R).map(([k, v]) => [<dt key={`${k}-dt`}>{k}</dt>, <dd key={`${k}-dd`}>{v}</dd>])}
        </dl>
      </details>
    </section>
  );
}
