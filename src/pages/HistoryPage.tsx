// Past results for a pseudonym, to see change over time. Everything here is public: anyone who
// enters the same pseudonym sees the same page.
import { useEffect, useState, type FormEvent } from "react";
import { TEST_TYPES, TEST_VERSION, type TestType } from "../core";
import { API_URL, fetchGroups, fetchHistory, fetchRawHistory } from "../app/api";
import { GROUPS, SAMPLE_GROUPS, sensitivities, shownMeasures, type GroupsResponse } from "../app/comparison";
import { normalizePseudonym, sampleHistory, type HistoryEntry, type HistoryResponse, type RawHistory } from "../app/history";
import { takenOn } from "../app/runText";
import { allSummariesJSON, downloadFile, fileBaseAt, pastSummaryJSON } from "../app/export";
import { reportEntry, savePDF, type Report } from "../app/report";
import { RunNotes, SessionNotes } from "../components/RunNotes";
import { SaveMenu } from "../components/SaveMenu";
import { RunSummary } from "../components/RunSummary";
import { runNumbers } from "../app/runNumbers";
import { GroupSection, type Load as GroupLoad } from "../components/GroupComparison";
import type { TaskName } from "../app/types";
import { TEST_TYPE_LABEL } from "../app/protocol";
import { back } from "../app/flow";
import { StaircaseChart, StaircaseKey } from "../components/StaircaseChart";
import { SensitivityBars } from "../components/SensitivityBars";
import { ResultsExplained } from "../components/ResultsExplained";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.history;

const TASKS: readonly TaskName[] = ["motion", "form"];

type Load =
  | { state: "idle" }
  | { state: "loading"; pseudonym: string }
  | { state: "error"; pseudonym: string }
  | { state: "ready"; history: HistoryResponse; sample: boolean };

const usingSample = (): boolean => !API_URL && import.meta.env.DEV;

/** Development only, labelled as sample: no quick-test groups yet. */
const EMPTY_SAMPLE_GROUPS: GroupsResponse = { test_version: TEST_VERSION, test_type: "quick", groups: { control: { n: 0, measures: null }, psychedelics: { n: 0, measures: null } } };

const date = (iso: string): string => new Date(iso).toLocaleDateString(text.common.locale, { day: "numeric", month: "short", year: "numeric" });
const time = (iso: string): string => new Date(iso).toLocaleTimeString(text.common.locale, { hour: "2-digit", minute: "2-digit" });

/** What can be saved: one session's or every session's summary or full data. Resolves to the file's name. */
type SaveKind = "summary" | "raw";
type Save = (kind: SaveKind, submissionId?: string) => Promise<string>;

const PDF_PENDING = t.makingPdf;

/** A file name for a PDF of several of a pseudonym's sessions. */
const manyPdfName = (pseudonym: string, which: "all" | "selected"): string =>
  `form-motion-coherence-${pseudonym.replace(/[^a-z0-9]+/g, "-")}-${which}-summaries.pdf`;

interface SessionEntryProps {
  entry: HistoryEntry;
  groups: Record<TestType, GroupLoad> | null;
  retry: () => void;
  /** The JSON saves, which need the backend; null without one. */
  save: Save | null;
  /** Saves this session's PDF summary. */
  savePdf: () => Promise<string>;
  selected: boolean;
  onSelect: (on: boolean) => void;
}

/** A tick box on the save button's grid: drawn like the disk, with 2px strokes on whole coordinates; the tick shows when chosen. */
const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect className="check-box" x="4" y="4" width="20" height="20" rx="3" />
    <path className="check-tick" d="M9 14l4 4 7-8" />
  </svg>
);

/** One past session: its numbers and how it was taken, beside its test type's groups as they are now, its staircases, and what was noted with it. */
function SessionEntry({ entry: e, groups, retry, save, savePdf, selected, onSelect }: SessionEntryProps) {
  const current = e.test_version === TEST_VERSION;
  const quick = e.test_type === "quick";
  return (
    <article className={selected ? "panel hist-entry save-card selected" : "panel hist-entry save-card"} aria-labelledby={`h-${e.submission_id}`}>
      <div className="card-tools">
        <label className="select-toggle" title={t.selectTitle}>
          <input type="checkbox" className="visually-hidden" checked={selected} onChange={ev => onSelect(ev.target.checked)} aria-label={t.selectLabel} />
          <CheckIcon />
        </label>
        <SaveMenu label={t.saveOneLabel} options={[
          { label: t.savePdf.label, description: t.savePdf.description, pending: PDF_PENDING, save: savePdf },
          ...(save ? [
            { label: t.saveSummary.label, description: t.saveSummary.description, save: () => save("summary", e.submission_id) },
            { label: t.saveFull.label, description: t.saveFull.description, save: () => save("raw", e.submission_id) },
          ] : []),
        ]} />
      </div>
      <header className="card-head">
        <h3 id={`h-${e.submission_id}`}>{date(e.started_at)} <span className="hist-time">{time(e.started_at)}</span>{quick && <> <span className="pill type-pill">{TEST_TYPE_LABEL.quick}</span></>}</h3>
        {e.run && <p className="hint run-taken">{text.charts.runNotes.takenOn(takenOn(e.run))}</p>}
      </header>
      {quick && <p className="hint"><Rich text={t.quickNote} /></p>}
      {!current && <p className="hint"><Rich text={t.earlierVersion} /></p>}
      <RunSummary results={runNumbers(e)} />
      {e.run && <RunNotes run={e.run} taken={false} />}
      <SessionNotes medications={e.medications} notes={e.notes} />
      {current && groups
        ? <GroupSection testType={e.test_type} load={groups[e.test_type]} own={e.values} retry={retry} heading={<h4>{t.groupsHeading}</h4>} />
        : <SensitivityBars own={sensitivities(e.values)} groups={[]} />}
      {e.staircases ? (
        <div className="charts">
          {TASKS.map(task => (
            <StaircaseChart key={task} task={task} points={e.staircases![task]} threshold={e.values[task === "motion" ? "motion_threshold_pct" : "form_threshold_pct"]}
              subtitle={t.staircaseSubtitle} />
          ))}
        </div>
      ) : <p className="hint">{t.noStaircases}</p>}
    </article>
  );
}

/** Pinned to the bottom of the window while sessions are selected: how many, and saving them as one PDF. */
function SelectionBar({ count, save, clear }: { count: number; save: () => Promise<string>; clear: () => void }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  // Whether the status says it saved, which clears sooner than a failure.
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!status || busy) return;
    const timer = setTimeout(() => setStatus(""), saved ? 4000 : 10000);
    return () => clearTimeout(timer);
  }, [status, busy, saved]);

  const onSave = async (): Promise<void> => {
    setBusy(true);
    setSaved(false);
    setStatus(PDF_PENDING);
    try {
      setStatus(t.saved(await save()));
      setSaved(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t.couldntSave);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="select-bar" id="history-selection" role="region" aria-label={t.selectionLabel}>
      <p><Rich text={t.selectedCount(count)} /></p>
      <span className="select-status" role="status" aria-live="polite">{status}</span>
      <div className="actions">
        <button type="button" className="btn secondary" id="history-select-clear" onClick={clear} disabled={busy}>{t.clear}</button>
        <button type="button" className="btn" id="history-save-selected" onClick={() => void onSave()} disabled={busy}>{t.saveAsPdf}</button>
      </div>
    </div>
  );
}

export function HistoryPage({ initialPseudonym }: { initialPseudonym: string }) {
  const [pseudonym, setPseudonym] = useState(initialPseudonym);
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [groups, setGroups] = useState<Partial<Record<TestType, GroupsResponse | "error">>>({});
  const [groupsAttempt, setGroupsAttempt] = useState(0);
  const retryGroups = (): void => setGroupsAttempt(a => a + 1);
  const [raw, setRaw] = useState<RawHistory | null>(null);
  // The sessions chosen for a PDF, by submission id.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const lookUp = async (raw: string): Promise<void> => {
    const p = normalizePseudonym(raw);
    if (!p) return;
    setRaw(null);
    setSelected(new Set());
    if (usingSample()) { setLoad({ state: "ready", history: sampleHistory(p), sample: true }); return; }
    setLoad({ state: "loading", pseudonym: p });
    try {
      setLoad({ state: "ready", history: await fetchHistory(p), sample: false });
    } catch {
      setLoad({ state: "error", pseudonym: p });
    }
  };

  // Open straight to a pseudonym passed from the Results page.
  useEffect(() => { if (initialPseudonym) void lookUp(initialPseudonym); }, [initialPseudonym]);

  // The groups each session is shown beside, fetched fresh on every visit so stored sessions are
  // always shown beside the groups as they are now: the full test's and the quick test's, each
  // only beside sessions of its own test type.
  useEffect(() => {
    if (usingSample()) { setGroups({ full: SAMPLE_GROUPS, quick: EMPTY_SAMPLE_GROUPS }); return; }
    if (!API_URL) return;
    const ctrl = new AbortController();
    setGroups({});
    for (const testType of TEST_TYPES) {
      fetchGroups(TEST_VERSION, testType, ctrl.signal).then(
        g => setGroups(prev => ({ ...prev, [testType]: g })),
        () => { if (!ctrl.signal.aborted) setGroups(prev => ({ ...prev, [testType]: "error" })); });
    }
    return () => ctrl.abort();
  }, [groupsAttempt]);

  const onSubmit = (e: FormEvent): void => { e.preventDefault(); void lookUp(pseudonym); };

  // The full sessions are only fetched when something is saved, then kept for further saves.
  const save = async (p: string, kind: SaveKind, submissionId?: string): Promise<string> => {
    let r = raw;
    if (!r || r.pseudonym !== p) {
      try { r = await fetchRawHistory(p); } catch { throw new Error(t.fetchFailed); }
      setRaw(r);
    }
    const one = submissionId ? r.sessions.find(s => s.submission_id === submissionId) : undefined;
    if (submissionId && !one) throw new Error(t.sessionMissing);
    const base = one ? fileBaseAt(one.started_at) : `form-motion-coherence-${p.replace(/[^a-z0-9]+/g, "-")}-all`;
    const filename = `${base}${kind === "summary" ? (one ? "-summary" : "-summaries") : ""}.json`;
    const data = one
      ? (kind === "summary" ? pastSummaryJSON(one) : JSON.stringify(one, null, 2))
      : (kind === "summary" ? allSummariesJSON(p, r.sessions) : JSON.stringify(r, null, 2));
    downloadFile(filename, data, "application/json");
    return filename;
  };
  const saver: Save | null = load.state === "ready" && !load.sample ? (kind, id) => save(load.history.pseudonym, kind, id) : null;
  const loadOf = (r: GroupsResponse | "error" | undefined): GroupLoad =>
    r === "error" ? { state: "error" } : r ? { state: "ready", stats: r, sample: usingSample() } : { state: "loading" };
  const groupLoads: Record<TestType, GroupLoad> | null = API_URL || usingSample() ? { full: loadOf(groups.full), quick: loadOf(groups.quick) } : null;
  const select = (id: string, on: boolean): void =>
    setSelected(prev => { const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next; });
  // PDFs are made from what the page already has, so they need no backend: the sessions, newest
  // first as listed, beside the groups as loaded here.
  const newestFirst = load.state === "ready" ? [...load.history.sessions].reverse() : [];
  const pdfOf = (entries: HistoryEntry[]): Report =>
    ({ pseudonym: load.state === "ready" ? load.history.pseudonym : null, sessions: entries.map(e => reportEntry(e, groupLoads)), sample: load.state === "ready" && load.sample });
  const chosen = newestFirst.filter(e => selected.has(e.submission_id));
  const anyShown = TEST_TYPES.some(t => { const r = groups[t]; return !!r && r !== "error" && GROUPS.some(g => shownMeasures(r.groups[g])); });

  return (
    <section className="view view-stack" data-view="history" aria-labelledby="history-h">
      <div className="panel">
        <h2 id="history-h">{t.heading}</h2>
        <p><Rich text={t.intro} /></p>
        {!API_URL && !usingSample() ? (
          <p className="hint"><Rich text={t.notAvailable} /></p>
        ) : (
          <form className="inline" onSubmit={onSubmit}>
            <input type="text" id="history-pseudonym" aria-label={t.pseudonymLabel} maxLength={40} autoComplete="off" spellCheck={false} value={pseudonym} onChange={e => setPseudonym(e.target.value)} />
            <button type="submit" className="btn" id="history-go" disabled={!normalizePseudonym(pseudonym) || load.state === "loading"}>{t.showResults}</button>
          </form>
        )}
        {load.state === "loading" && <p className="hint">{t.lookingUp(load.pseudonym)}</p>}
        {load.state === "error" && <p className="hint">{t.loadFailed(load.pseudonym)}</p>}
        {load.state === "ready" && load.history.sessions.length === 0 && (
          <p className="hint" id="history-none">{t.noResults(load.history.pseudonym)}</p>
        )}
      </div>

      {load.state === "ready" && load.history.sessions.length > 0 && (
        <>
          <div className="panel save-card" id="history-results">
            <SaveMenu id="history-save" label={t.saveAllLabel} text={t.saveAllButton} options={[
              { id: "history-save-pdf", label: t.saveAllPdf.label, description: t.saveAllPdf.description(load.history.pseudonym), pending: PDF_PENDING, save: () => savePDF(manyPdfName(load.history.pseudonym, "all"), pdfOf(newestFirst)) },
              ...(saver ? [
                { id: "history-save-summaries", label: t.saveAllSummaries.label, description: t.saveAllSummaries.description(load.history.pseudonym), save: () => saver("summary") },
                { id: "history-save-raw", label: t.saveAllRaw.label, description: t.saveAllRaw.description(load.history.pseudonym), save: () => saver("raw") },
              ] : []),
            ]} />
            {load.sample && <p className="banner">{t.sampleBanner}</p>}
            <h3>{t.sessionsHeading(load.history.pseudonym, load.history.sessions.length)}</h3>
            <p className="hint"><Rich text={t.justForFun} /></p>
            {load.history.sessions.length > 1 && (
              <p className="hint" id="history-practice"><Rich text={t.practice} /></p>
            )}
            <ResultsExplained groups={anyShown} thresholdCharts />
            <p className="hint"><Rich text={t.staircasesHint} /></p>
            <StaircaseKey />
            {newestFirst.length > 1 && <p className="hint" id="history-select-hint"><Rich text={t.selectHint} /></p>}
          </div>
          {newestFirst.map(e => (
            <SessionEntry key={e.submission_id} entry={e} groups={groupLoads} retry={retryGroups} save={saver}
              savePdf={() => savePDF(`${fileBaseAt(e.started_at)}-summary.pdf`, pdfOf([e]))}
              selected={selected.has(e.submission_id)} onSelect={on => select(e.submission_id, on)} />
          ))}
          {chosen.length > 0 && (
            <SelectionBar count={chosen.length} clear={() => setSelected(new Set())}
              save={() => savePDF(manyPdfName(load.history.pseudonym, "selected"), pdfOf(chosen))} />
          )}
        </>
      )}

      <div className="actions"><button type="button" className="btn secondary back" id="history-back" onClick={back}>{text.common.back}</button></div>
    </section>
  );
}
