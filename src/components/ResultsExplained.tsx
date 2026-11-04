// What each number on the results pages measures, in plain terms: the opening line always shows,
// and each measure's explanation opens on request. The words are in app/explanations.ts, which the
// PDF summaries share.
import { EXPLAIN_LEAD, explanations } from "../app/explanations";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.charts.explained;

interface ResultsExplainedProps {
  /** Whether group bars are on the page, so their parts need explaining. */
  groups: boolean;
  /** Whether the page also has the threshold charts, with their middle-80% band. */
  thresholdCharts?: boolean;
}

export function ResultsExplained({ groups, thresholdCharts = false }: ResultsExplainedProps) {
  return (
    <div className="explain" id="results-explained">
      <h3>{t.heading}</h3>
      <p><Rich text={EXPLAIN_LEAD} /></p>
      <details className="explain-more">
        <summary>{t.more}</summary>
        <div className="explain-grid">
          {explanations({ groups, thresholdCharts }).map(e => (
            <section key={e.title}>
              <h4>{e.title}</h4>
              <p><Rich text={e.text} /></p>
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}
