// Past results for a pseudonym, to see change over time. Everything here is public: anyone who
// enters the same pseudonym sees the same page.
import { useEffect, useState, type FormEvent } from "react";
import { TEST_VERSION } from "../core";
import { API_URL, fetchGroups, fetchHistory } from "../app/api";
import { SAMPLE_GROUPS, shownMeasures, type GroupsResponse } from "../app/comparison";
import { normalizePseudonym, sampleHistory, type HistoryEntry, type HistoryResponse } from "../app/history";
import { fmt } from "../app/format";
import { back } from "../app/flow";
import { HistoryChart } from "../components/HistoryChart";

type Load =
  | { state: "idle" }
  | { state: "loading"; pseudonym: string }
  | { state: "error"; pseudonym: string }
  | { state: "ready"; history: HistoryResponse; sample: boolean };

const usingSample = (): boolean => !API_URL && import.meta.env.DEV;

const date = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SessionTable({ sessions }: { sessions: HistoryEntry[] }) {
  return (
    <div className="table-wrap">
      <table id="history-table">
        <thead><tr><th scope="col">Date</th><th scope="col">Motion</th><th scope="col">Form</th><th scope="col">Medications</th><th scope="col">Notes</th></tr></thead>
        <tbody>
          {[...sessions].reverse().map(s => (
            <tr key={s.submission_id}>
              <td>{date(s.started_at)}</td>
              <td>{fmt.pct(s.values.motion_threshold_pct)}</td>
              <td>{fmt.pct(s.values.form_threshold_pct)}</td>
              <td className="wrap-cell">{s.medications?.join(", ") ?? ""}</td>
              <td className="wrap-cell">{s.notes ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HistoryPage({ initialPseudonym }: { initialPseudonym: string }) {
  const [pseudonym, setPseudonym] = useState(initialPseudonym);
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [groups, setGroups] = useState<GroupsResponse | null>(null);

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

  // The control group's range, drawn behind the charts once the group is big enough.
  useEffect(() => {
    if (usingSample()) { setGroups(SAMPLE_GROUPS); return; }
    if (!API_URL) return;
    const ctrl = new AbortController();
    fetchGroups(TEST_VERSION, ctrl.signal).then(setGroups, () => setGroups(null));
    return () => ctrl.abort();
  }, []);

  const onSubmit = (e: FormEvent): void => { e.preventDefault(); void lookUp(pseudonym); };
  const measures = groups ? shownMeasures(groups.groups.control) : null;

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

      {load.state === "ready" && load.history.sessions.length > 0 && (() => {
        const current = load.history.sessions.filter(s => s.test_version === TEST_VERSION);
        const older = load.history.sessions.filter(s => s.test_version !== TEST_VERSION);
        return (
          <div className="panel" id="history-results">
            {load.sample && <p className="banner">Sample data for development. This isn't anyone's real history.</p>}
            <h3>{load.history.pseudonym}: {load.history.sessions.length} {load.history.sessions.length === 1 ? "session" : "sessions"}</h3>
            {current.length > 0 ? (
              <>
                <p className="hint">Lower thresholds mean less organised signal was needed. {measures ? "The shaded band is the middle half of the control group (people who said they have no visual perceptual disorder and have never used psychedelic drugs), and the dashed line their median." : ""}</p>
                <div className="charts">
                  <HistoryChart measure="motion_threshold_pct" title="Motion threshold" series="motion" sessions={current} controls={measures?.motion_threshold_pct ?? null} />
                  <HistoryChart measure="form_threshold_pct" title="Form threshold" series="form" sessions={current} controls={measures?.form_threshold_pct ?? null} />
                  <HistoryChart measure="motion_minus_form" title="Motion minus form sensitivity" series="diff" sessions={current} controls={measures?.motion_minus_form ?? null} />
                </div>
                <SessionTable sessions={current} />
              </>
            ) : <p className="hint">None of these sessions used the current version of the test, so they aren't charted.</p>}
            {older.length > 0 && (
              <>
                <h3>Earlier versions of the test</h3>
                <p className="hint">These used a different version of the test, so they can't be compared with the sessions above.</p>
                <SessionTable sessions={older} />
              </>
            )}
            <p className="hint">Just for fun, and not medical advice. Results in a browser vary from day to day with screens, lighting, tiredness and attention, so look at the overall trend rather than any one session.</p>
          </div>
        );
      })()}

      <div className="actions"><button type="button" className="btn secondary back" id="history-back" onClick={back}>Back</button></div>
    </section>
  );
}
