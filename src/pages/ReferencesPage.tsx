// Every parameter of the test and where it comes from, and the papers it's built on. Each version
// of the test is a different test, so a drop-down picks which one is shown. The quick test is the
// same test with fewer trials, so it's explained with its version rather than picked separately.
import { useState } from "react";
import { back } from "../app/flow";
import { TEST_VERSION } from "../core";
import { CALIBRATION_TABLE, METHOD_VERSIONS, REFERENCES, type ProtocolGroup } from "../components/methodData";
import { GROUP_INFO, GROUPS, MIN_GROUP } from "../app/comparison";

export function ReferencesPage() {
  const [version, setVersion] = useState(TEST_VERSION);
  const method = METHOD_VERSIONS.find(m => m.version === version) ?? METHOD_VERSIONS[0];
  const before = METHOD_VERSIONS.find(m => m.version < method.version);
  const groups: ProtocolGroup[] = [method.tasks, CALIBRATION_TABLE];
  const refs = REFERENCES.filter(r => (r.since ?? 1) <= method.version);

  return (
    <section className="view view-stack" data-view="references" aria-labelledby="references-h">
      <div className="panel">
        <h2 id="references-h">Method and references</h2>
        <p>The test is rebuilt from published vision research. These are its parameters and where each comes from. Each version of the test is a different test, so pick the one you want to read about.</p>
        <div className="method-pick">
          <label>
            <span>Version</span>
            <select value={method.version} onChange={e => setVersion(Number(e.target.value))}>
              {METHOD_VERSIONS.map(m => <option key={m.version} value={m.version}>Version {m.version}{m.version === TEST_VERSION ? " (current)" : ""}</option>)}
            </select>
          </label>
        </div>
        <p>{method.about}</p>
        {before && method.changes.length > 0 && (
          <>
            <h3>What changed from version {before.version}</h3>
            <ul className="key-points">{method.changes.map(c => <li key={c}>{c}</li>)}</ul>
          </>
        )}
        {method.quick && (
          <>
            <h3>The quick test</h3>
            <p>{method.quick.about}</p>
            <ul className="key-points">{method.quick.differences.map(c => <li key={c}>{c}</li>)}</ul>
          </>
        )}
        <h3>The comparison groups</h3>
        <p>The results pages show a run beside two groups of people who contributed results, as they described themselves when they did:</p>
        <ul className="key-points">
          {GROUPS.map(g => <li key={g}><strong>{GROUP_INFO[g].name}:</strong> {GROUP_INFO[g].who}.</li>)}
        </ul>
        <p>Only sessions where both tasks reached a threshold are counted. People who answered "prefer not to say" about psychedelics are in neither group, and so is anyone who reported a visual perceptual disorder. Groups are kept separately for each version of the test and for the full and quick tests, and a run is only shown beside groups from its own. A group isn't shown until at least {MIN_GROUP} people are in it: fewer would mean little, and couldn't keep individuals hidden. For each group the pages show the median, the middle half and the middle 80% of results. Results taken in a browser vary with screens, lighting and attention, and people describe themselves, so the groups are information only: nothing is concluded from where a result falls.</p>
        <h3>Taking the test more than once</h3>
        <p>Repeated testing could lower thresholds without any other change, through familiarity with the task and through perceptual learning. In the lab, coherence thresholds for dynamic Glass patterns fell over eight daily sessions of 600 trials, fastest in the first sessions, and the learning transferred to random-dot motion without form cues (Donato et al. 2024). Training on global motion direction improved performance over five days, but only with feedback on every trial: without it, ten days of training brought no significant change (Asher et al. 2019). This test gives feedback only on its practice trials, and a session is far shorter than those studies' training, so how much repeating it affects results isn't known. Familiarity with the task probably affects both tasks alike and so partly cancels in motion − form. Perceptual learning might not, since in both studies how far it transferred depended on the stimulus. The groups pool every contributed session without removing repeats, so one practised person can contribute several sessions to a group. In the public export, sessions sent with the same pseudonym can be linked, so repeats can be found or left out; sessions sent without a pseudonym can't be linked.</p>
        <div className="table-wrap">
          <table className="protocol">
            <thead>
              <tr><th scope="col">Parameter</th><th scope="col">Value</th><th scope="col">Source</th></tr>
            </thead>
            <tbody>
              {groups.flatMap(group => [
                <tr key={group.title}><th scope="rowgroup" colSpan={3}>{group.title}</th></tr>,
                ...group.rows.map(row => (
                  <tr key={`${group.title}/${row.parameter}`}><td>{row.parameter}</td><td>{row.value}</td><td>{row.source}</td></tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
        <h3>References</h3>
        <ul className="refs">
          {refs.map(r => (
            <li key={r.href}>{r.before}<i>{r.journal}</i>{r.after}<a href={r.href} target="_blank" rel="noopener noreferrer">{r.label}</a></li>
          ))}
        </ul>
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>Back</button></div>
    </section>
  );
}
