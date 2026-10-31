// Every parameter of the test and where it comes from, and the papers it's built on.
import { back } from "../app/flow";
import { PROTOCOL_TABLE, REFERENCES } from "../components/methodData";

export function ReferencesPage() {
  return (
    <section className="view view-stack" data-view="references" aria-labelledby="references-h">
      <div className="panel">
        <h2 id="references-h">Method and references</h2>
        <p>The test is rebuilt from published vision research. These are its parameters and where each comes from.</p>
        <div className="table-wrap">
          <table className="protocol">
            <thead>
              <tr><th scope="col">Parameter</th><th scope="col">Value</th><th scope="col">Source</th></tr>
            </thead>
            <tbody>
              {PROTOCOL_TABLE.flatMap(group => [
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
          {REFERENCES.map(r => (
            <li key={r.href}>{r.before}<i>{r.journal}</i>{r.after}<a href={r.href} target="_blank" rel="noopener noreferrer">{r.label}</a></li>
          ))}
        </ul>
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>Back</button></div>
    </section>
  );
}
