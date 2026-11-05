// Every parameter of the test and where it comes from, and the papers it's built on. Each version
// of the test is a different test, so a drop-down picks which one is shown. The quick test is the
// same test with fewer trials, so it's explained with its version rather than picked separately.
// The page's words are in src/text/en/references.md and its tables in method.ts beside it; the
// papers are in methodData.ts.
import { useState } from "react";
import { back } from "../app/flow";
import { TEST_VERSION } from "../core";
import { REFERENCES } from "../components/methodData";
import type { ProtocolGroup } from "../text/method";
import { GROUPS, MIN_GROUP } from "../app/comparison";
import { GROUP_INFO } from "../app/groupText";
import { text } from "../text";
import { Doc } from "../text/Doc";

const t = text.infoPages.references;
const { versions: METHOD_VERSIONS, calibration: CALIBRATION_TABLE } = text.method;

export function ReferencesPage() {
  const [version, setVersion] = useState(TEST_VERSION);
  const method = METHOD_VERSIONS.find(m => m.version === version) ?? METHOD_VERSIONS[0];
  const before = METHOD_VERSIONS.find(m => m.version < method.version);
  const groups: ProtocolGroup[] = [method.tasks, CALIBRATION_TABLE];
  const refs = REFERENCES.filter(r => (r.since ?? 1) <= method.version);

  const parts = {
    versionPicker: (
      <div className="method-pick">
        <label>
          <span>{t.versionLabel}</span>
          <select value={method.version} onChange={e => setVersion(Number(e.target.value))}>
            {METHOD_VERSIONS.map(m => <option key={m.version} value={m.version}>{t.versionOption(m.version, m.version === TEST_VERSION)}</option>)}
          </select>
        </label>
      </div>
    ),
    version: (
      <>
        <p>{method.about}</p>
        {before && method.changes.length > 0 && (
          <>
            <h3>{t.changedFrom(before.version)}</h3>
            <ul className="key-points">{method.changes.map(c => <li key={c}>{c}</li>)}</ul>
          </>
        )}
        {method.quick && (
          <>
            <h3>{t.quickHeading}</h3>
            <p>{method.quick.about}</p>
            <ul className="key-points">{method.quick.differences.map(c => <li key={c}>{c}</li>)}</ul>
          </>
        )}
      </>
    ),
    groups: (
      <ul className="key-points">
        {GROUPS.map(g => <li key={g}><strong>{GROUP_INFO[g].name}:</strong> {GROUP_INFO[g].who}.</li>)}
      </ul>
    ),
    protocol: (
      <div className="table-wrap">
        <table className="protocol">
          <thead>
            <tr><th scope="col">{t.parameter}</th><th scope="col">{t.value}</th><th scope="col">{t.source}</th></tr>
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
    ),
    references: (
      <ul className="refs">
        {refs.map(r => (
          <li key={r.href}>{r.before}<i>{r.journal}</i>{r.after}<a href={r.href} target="_blank" rel="noopener noreferrer">{r.label}</a></li>
        ))}
      </ul>
    ),
  };

  return (
    <section className="view view-stack" data-view="references" aria-labelledby="references-h">
      <div className="panel">
        <Doc blocks={t.page} titleId="references-h" parts={parts} values={{ minGroup: MIN_GROUP }} />
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>{text.common.back}</button></div>
    </section>
  );
}
