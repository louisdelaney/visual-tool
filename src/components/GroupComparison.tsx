// The person's results beside two groups of people who said they don't have or suspect a visual
// perceptual disorder: the control group (never used psychedelic drugs) and those who have used
// them. For each measure, one shared axis with a lane per group showing its 10th–90th and
// 25th–75th percentile ranges and median, and the person's own value marked across both lanes.
// It only shows the numbers: it draws no conclusions from where a value falls.
import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, fetchGroups } from "../app/api";
import { GROUP_INFO, GROUPS, MEASURES, MIN_GROUP, ownValues, SAMPLE_GROUPS, shownMeasures, type GroupKey, type GroupsResponse, type MeasureKey, type Quantiles } from "../app/comparison";
import type { Session } from "../app/types";
import { fmt } from "../app/format";
import { useElementWidth } from "../hooks";

interface MeasureInfo {
  title: string;
  /** Series colour class, matching the staircase charts. */
  series: "motion" | "form" | "diff";
  log: boolean;
  format: (v: number) => string;
  /** What higher or lower means. */
  reading: string;
}

const INFO: Record<MeasureKey, MeasureInfo> = {
  motion_threshold_pct: { title: "Motion threshold", series: "motion", log: true, format: v => fmt.pct(v), reading: "Lower means less organised motion was needed to see it." },
  form_threshold_pct: { title: "Form threshold", series: "form", log: true, format: v => fmt.pct(v), reading: "Lower means less organised form was needed to see it." },
  motion_minus_form: { title: "Motion minus form sensitivity", series: "diff", log: false, format: v => fmt.signed(v, 3), reading: "Above zero means motion sensitivity was higher than form sensitivity." },
};

const LANE = 40;
const TOP = 4;
const AXIS_H = 20;
const PAD = { l: 14, r: 14 };
const LOG_TICKS = [1, 2, 5, 10, 20, 50, 100];

/** Axis covering every group's range and the person's value, with some room either side. */
function axis(qs: Quantiles[], value: number | null, log: boolean): { to: (v: number) => number; ticks: number[] } {
  const lo = Math.min(...qs.map(q => q.p10), value ?? Infinity), hi = Math.max(...qs.map(q => q.p90), value ?? -Infinity);
  if (log) {
    const a = Math.log10(Math.max(1, lo / 1.4)), b = Math.log10(Math.min(100, hi * 1.4));
    const ticks = LOG_TICKS.filter(t => Math.log10(t) >= a - 1e-9 && Math.log10(t) <= b + 1e-9);
    return { to: v => (Math.log10(Math.min(100, Math.max(1, v))) - a) / (b - a || 1), ticks };
  }
  const span = hi - lo || 0.01, a = lo - span * 0.25, b = hi + span * 0.25;
  // The smallest round step (1, 2 or 5 × 10^k) that gives at most five ticks.
  const base = Math.pow(10, Math.floor(Math.log10(b - a)) - 1);
  const step = [1, 2, 5, 10, 20, 50].map(m => m * base).find(st => Math.floor(b / st) - Math.ceil(a / st) + 1 <= 5) ?? 100 * base;
  const ticks: number[] = [];
  for (let k = Math.ceil(a / step); k * step <= b + 1e-12; k++) ticks.push(Number((k * step).toPrecision(6)));
  return { to: v => (v - a) / (b - a), ticks };
}

const describe = (info: MeasureInfo, q: Quantiles): string =>
  `median ${info.format(q.p50)}, middle half ${info.format(q.p25)} to ${info.format(q.p75)}, middle 80% ${info.format(q.p10)} to ${info.format(q.p90)}`;

interface MeasureRowProps {
  measure: MeasureKey;
  lanes: { group: GroupKey; q: Quantiles }[];
  value: number | null;
}

function MeasureRow({ measure, lanes, value }: MeasureRowProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const W = Math.max(260, Math.round(useElementWidth(hostRef, 320)));
  const info = INFO[measure];
  const { to, ticks } = axis(lanes.map(l => l.q), value, info.log);
  const x = (v: number): number => PAD.l + to(v) * (W - PAD.l - PAD.r);
  const H = TOP + lanes.length * LANE + AXIS_H;
  // Enough decimals to tell neighbouring ticks apart.
  const decimals = ticks.length > 1 ? Math.max(0, -Math.floor(Math.log10(ticks[1]! - ticks[0]!) + 1e-9)) : 2;
  const yours = value == null ? "Your run didn't reach a value for this." : `Yours: ${info.format(value)}.`;
  const groups = lanes.map(l => `${GROUP_INFO[l.group].name}: ${describe(info, l.q)}.`);

  return (
    <div className={`cmp-row cmp-${info.series}`}>
      <div className="cmp-head">
        <span className="cmp-title">{info.title}</span>
        <span className="cmp-value">{value == null ? "–" : info.format(value)}</span>
      </div>
      <div className="chart-host" ref={hostRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="cmp-chart" role="img" aria-label={`${info.title}. ${yours} ${groups.join(" ")}`}>
          {!info.log && ticks.includes(0) && <line className="cmp-zero" x1={x(0)} x2={x(0)} y1={TOP} y2={TOP + lanes.length * LANE} />}
          {lanes.map(({ group, q }, i) => {
            const y = TOP + i * LANE + 27;
            return (
              <g key={group}>
                <text className="cmp-lane" x={PAD.l} y={y - 14}>{GROUP_INFO[group].name}</text>
                <line className="cmp-track" x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} />
                <rect className="cmp-outer" x={x(q.p10)} y={y - 7} width={Math.max(1, x(q.p90) - x(q.p10))} height={14} rx={3} />
                <rect className="cmp-inner" x={x(q.p25)} y={y - 7} width={Math.max(1, x(q.p75) - x(q.p25))} height={14} rx={3} />
                <line className="cmp-median" x1={x(q.p50)} x2={x(q.p50)} y1={y - 10} y2={y + 10} />
              </g>
            );
          })}
          {value != null && (
            <>
              <line className="cmp-you-line" x1={x(value)} x2={x(value)} y1={TOP + 14} y2={TOP + lanes.length * LANE} />
              {lanes.map((l, i) => <circle key={l.group} className="cmp-you" cx={x(value)} cy={TOP + i * LANE + 27} r={5.5} />)}
            </>
          )}
          {ticks.map(t => (
            <text key={t} className="tick" x={x(t)} y={H - 4} textAnchor="middle">{info.log ? `${t}%` : fmt.signed(t, decimals)}</text>
          ))}
        </svg>
      </div>
      <p className="cmp-text">{yours} {groups.join(" ")} {info.reading}</p>
    </div>
  );
}

type Load =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; stats: GroupsResponse; sample: boolean };

/** The comparison section, or nothing in a build with no backend. */
export function GroupComparison({ session }: { session: Session }) {
  const usingSample = !API_URL && import.meta.env.DEV;
  const [load, setLoad] = useState<Load>(() => (usingSample ? { state: "ready", stats: SAMPLE_GROUPS, sample: true } : { state: "loading" }));
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    if (!API_URL) return;
    const ctrl = new AbortController();
    setLoad({ state: "loading" });
    fetchGroups(session.testVersion, ctrl.signal)
      .then(stats => setLoad({ state: "ready", stats, sample: false }))
      .catch(() => { if (!ctrl.signal.aborted) setLoad({ state: "error" }); });
    return () => ctrl.abort();
  }, [session.testVersion, attempt]);

  if (!API_URL && !usingSample) return null;
  const results = session.results;
  if (!results) return null;

  const shown = load.state === "ready" ? GROUPS.flatMap(g => { const m = shownMeasures(load.stats.groups[g]); return m ? [{ group: g, measures: m }] : []; }) : [];
  const waiting = load.state === "ready" ? GROUPS.filter(g => !shownMeasures(load.stats.groups[g])) : [];
  const own = ownValues(results);

  return (
    <div className="panel" id="comparison" aria-labelledby="comparison-h">
      <h3 id="comparison-h">You and other groups</h3>
      {load.state === "loading" && <p className="hint">Loading the comparison…</p>}
      {load.state === "error" && (
        <>
          <p className="hint">Couldn't load the comparison. Check your connection and try again.</p>
          <div className="actions"><button type="button" className="btn secondary" onClick={retry}>Try again</button></div>
        </>
      )}
      {load.state === "ready" && (
        <>
          {load.sample && <p className="banner">Sample data for development. These are not real groups.</p>}
          <p>
            Your results are shown beside two groups of people who contributed results on this version of the test, as they described themselves:
          </p>
          <ul className="cmp-groups">
            {GROUPS.map(g => (
              <li key={g}><strong>{GROUP_INFO[g].name}:</strong> {GROUP_INFO[g].who}. {load.stats.groups[g].n} {load.stats.groups[g].n === 1 ? "person" : "people"} so far.</li>
            ))}
          </ul>
          {shown.length > 0 && (
            <>
              <p>
                For each group, the lighter bar covers the middle 80% of results, the darker bar the middle half, and the line is the median. The dot is yours. This is information only: nothing is concluded from where your results fall.
              </p>
              <div className="cmp-rows">
                {MEASURES.map(m => <MeasureRow key={m} measure={m} lanes={shown.map(s => ({ group: s.group, q: s.measures[m] }))} value={own[m]} />)}
              </div>
            </>
          )}
          {waiting.length > 0 && (
            <p className="hint">
              A group appears once at least {MIN_GROUP} people in it have contributed. Not shown yet: {waiting.map(g => GROUP_INFO[g].name).join(" and ")}.
            </p>
          )}
          <p className="hint">
            Just for fun, and not medical advice. Results taken in a browser vary with screens, lighting and attention, and people describe themselves.
          </p>
        </>
      )}
    </div>
  );
}
