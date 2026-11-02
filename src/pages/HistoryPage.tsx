// Past results for a pseudonym, to see change over time. Everything here is public: anyone who
// enters the same pseudonym sees the same page.
import { useEffect, useState, type FormEvent } from "react";
import { TEST_TYPES, TEST_VERSION, type TestType } from "../core";
import { API_URL, fetchGroups, fetchHistory } from "../app/api";
import { GROUPS, SAMPLE_GROUPS, sensitivities, shownMeasures, type GroupKey, type GroupsResponse, type MeasureKey, type Quantiles } from "../app/comparison";
import { normalizePseudonym, sampleHistory, type HistoryEntry, type HistoryResponse } from "../app/history";
import type { TaskName } from "../app/types";
import { TEST_TYPE_LABEL } from "../app/protocol";
import { fmt } from "../app/format";
import { back } from "../app/flow";
import { StaircaseChart, StaircaseKey } from "../components/StaircaseChart";
import { SensitivityBars } from "../components/SensitivityBars";
import { ResultsExplained } from "../components/ResultsExplained";

const TASKS: readonly TaskName[] = ["motion", "form"];

type Load =
  | { state: "idle" }
  | { state: "loading"; pseudonym: string }
  | { state: "error"; pseudonym: string }
  | { state: "ready"; history: HistoryResponse; sample: boolean };

const usingSample = (): boolean => !API_URL && import.meta.env.DEV;

const date = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const time = (iso: string): string => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

type Shown = { group: GroupKey; n: number; measures: Record<MeasureKey, Quantiles> }[];

/** One past session: its sensitivity bars beside its test type's groups, its staircases, and what was noted with it. */
function SessionEntry({ entry: e, groups }: { entry: HistoryEntry; groups: Record<TestType, Shown> }) {
  const current = e.test_version === TEST_VERSION;
  const quick = e.test_type === "quick";
  return (
    <article className="panel hist-entry" aria-labelledby={`h-${e.submission_id}`}>
      <h3 id={`h-${e.submission_id}`}>{date(e.started_at)} <span className="hist-time">{time(e.started_at)}</span>{quick && <> <span className="pill type-pill">{TEST_TYPE_LABEL.quick}</span></>}</h3>
      {quick && <p className="hint">A quick test: a shorter run, so its results are less precise than a full test's. It's shown only beside other quick-test results.</p>}
      {!current && <p className="hint">This used an earlier version of the test, so it isn't shown beside the groups.</p>}
      <dl className="meta">
        <dt>Motion threshold</dt><dd>{fmt.pct(e.values.motion_threshold_pct)}</dd>
        <dt>Form threshold</dt><dd>{fmt.pct(e.values.form_threshold_pct)}</dd>
        {e.medications?.length ? <><dt>Medications</dt><dd>{e.medications.join(", ")}</dd></> : null}
        {e.notes ? <><dt>Notes</dt><dd>{e.notes}</dd></> : null}
      </dl>
      <SensitivityBars own={sensitivities(e.values)} groups={current ? groups[e.test_type] : []} />
      {e.staircases ? (
        <div className="charts">
          {TASKS.map(t => (
            <StaircaseChart key={t} task={t} points={e.staircases![t]} threshold={e.values[t === "motion" ? "motion_threshold_pct" : "form_threshold_pct"]}
              subtitle="Coherence (%) on each scored trial, log scale" />
          ))}
        </div>
      ) : <p className="hint">No staircases were kept for this session.</p>}
    </article>
  );
}

export function HistoryPage({ initialPseudonym }: { initialPseudonym: string }) {
  const [pseudonym, setPseudonym] = useState(initialPseudonym);
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [groups, setGroups] = useState<Partial<Record<TestType, GroupsResponse>>>({});

  const lookUp = async (raw: string): Promise<void> => {
    const p = normalizePseudonym(raw);
    if (!p) return;
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

  // The groups each session is shown beside, once each is big enough: the full test's and the
  // quick test's, each only beside sessions of its own test type.
  useEffect(() => {
    if (usingSample()) { setGroups({ full: SAMPLE_GROUPS }); return; }
    if (!API_URL) return;
    const ctrl = new AbortController();
    for (const testType of TEST_TYPES) {
      fetchGroups(TEST_VERSION, testType, ctrl.signal).then(g => setGroups(prev => ({ ...prev, [testType]: g })), () => {});
    }
    return () => ctrl.abort();
  }, []);

  const onSubmit = (e: FormEvent): void => { e.preventDefault(); void lookUp(pseudonym); };
  const shownFor = (r: GroupsResponse | undefined): Shown =>
    r ? GROUPS.flatMap(g => { const m = shownMeasures(r.groups[g]); return m ? [{ group: g, n: r.groups[g].n, measures: m }] : []; }) : [];
  const shown: Record<TestType, Shown> = { full: shownFor(groups.full), quick: shownFor(groups.quick) };

  return (
    <section className="view view-stack" data-view="history" aria-labelledby="history-h">
      <div className="panel">
        <h2 id="history-h">User results</h2>
        <p>Enter the pseudonym you used when you contributed. Results are public: anyone who enters the same pseudonym sees this page.</p>
        {!API_URL && !usingSample() ? (
          <p className="hint">Looking up past results isn't available on this copy of the test yet.</p>
        ) : (
          <form className="inline" onSubmit={onSubmit}>
            <input type="text" id="history-pseudonym" aria-label="Pseudonym" maxLength={40} autoComplete="off" spellCheck={false} value={pseudonym} onChange={e => setPseudonym(e.target.value)} />
            <button type="submit" className="btn" id="history-go" disabled={!normalizePseudonym(pseudonym) || load.state === "loading"}>Show results</button>
          </form>
        )}
        {load.state === "loading" && <p className="hint">Looking up {load.pseudonym}…</p>}
        {load.state === "error" && <p className="hint">Couldn't load results for {load.pseudonym}. Check your connection and try again.</p>}
        {load.state === "ready" && load.history.sessions.length === 0 && (
          <p className="hint" id="history-none">No results for "{load.history.pseudonym}". Pseudonyms ignore capitals and extra spaces, but otherwise must match exactly.</p>
        )}
      </div>

      {load.state === "ready" && load.history.sessions.length > 0 && (
        <>
          <div className="panel" id="history-results">
            {load.sample && <p className="banner">Sample data for development. This isn't anyone's real history.</p>}
            <h3>{load.history.pseudonym}: {load.history.sessions.length} {load.history.sessions.length === 1 ? "session" : "sessions"}, newest first</h3>
            <p className="hint">Just for fun, and not medical advice.</p>
            <ResultsExplained groups={shown.full.length + shown.quick.length > 0} />
            <p className="hint">The staircases show the share of organised dots on each scored trial.</p>
            <StaircaseKey />
          </div>
          {[...load.history.sessions].reverse().map(e => <SessionEntry key={e.submission_id} entry={e} groups={shown} />)}
        </>
      )}

      <div className="actions"><button type="button" className="btn secondary back" id="history-back" onClick={back}>Back</button></div>
    </section>
  );
}
