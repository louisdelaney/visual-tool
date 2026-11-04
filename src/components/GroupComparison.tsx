// The person's results beside two groups of people who said they don't have or suspect a visual
// perceptual disorder: the control group (never used psychedelic drugs) and those who have used
// them. Sensitivity bars first; then the threshold charts give each measure one shared axis with a lane per group showing its 10th–90th and 25th–75th
// percentile ranges and median, and the person's own value marked across both lanes.
// It only shows the numbers: it draws no conclusions from where a value falls.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { API_URL, fetchGroups } from "../app/api";
import { GROUPS, MEASURES, ownValues, SAMPLE_GROUPS, sensitivities, shownGroups, type ShownGroup, type GroupKey, type GroupsResponse, type MeasureKey, type Quantiles } from "../app/comparison";
import { describeQuantiles, GROUP_INFO, groupLine, groupsIntro, MEASURE_INFO, sensitivityNote, THRESHOLD_CHARTS_NOTE } from "../app/groupText";
import { rangeAxis, tickDecimals } from "../app/scales";
import type { Session } from "../app/types";
import type { TestType } from "../core/protocol";
import { fmt } from "../app/format";
import { useElementWidth } from "../hooks";
import { SensitivityBars } from "./SensitivityBars";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.charts;

const LANE = 40;
const TOP = 4;
const AXIS_H = 20;
const PAD = { l: 14, r: 14 };

interface MeasureRowProps {
  measure: MeasureKey;
  lanes: { group: GroupKey; q: Quantiles }[];
  value: number | null;
}

function MeasureRow({ measure, lanes, value }: MeasureRowProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const W = Math.max(260, Math.round(useElementWidth(hostRef, 320)));
  const info = MEASURE_INFO[measure];
  const { to, ticks } = rangeAxis(lanes.map(l => l.q), value, info.log);
  const x = (v: number): number => PAD.l + to(v) * (W - PAD.l - PAD.r);
  const H = TOP + lanes.length * LANE + AXIS_H;
  const decimals = tickDecimals(ticks, 0);
  const yours = value == null ? t.thresholdRow.noValue : t.thresholdRow.value(info.format(value));
  const groups = lanes.map(l => t.thresholdRow.group(GROUP_INFO[l.group].name, describeQuantiles(info, l.q)));

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
          {ticks.map(tick => (
            <text key={tick} className="tick" x={x(tick)} y={H - 4} textAnchor="middle">{info.log ? `${tick}%` : fmt.signed(tick, decimals)}</text>
          ))}
        </svg>
      </div>
      <p className="cmp-text">{yours} {groups.join(" ")} <Rich text={info.reading} /></p>
    </div>
  );
}

export type Load =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; stats: GroupsResponse; sample: boolean };

/** The groups a session is shown beside, loaded once for the page: the bars and the threshold charts share them. */
export interface GroupStats {
  load: Load;
  retry: () => void;
  /** False in a build with no backend, where nothing about groups is shown. */
  available: boolean;
}

export function useGroupStats(session: Session): GroupStats {
  const usingSample = !API_URL && import.meta.env.DEV;
  const [load, setLoad] = useState<Load>(() => (usingSample ? { state: "ready", stats: SAMPLE_GROUPS, sample: true } : { state: "loading" }));
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    if (!API_URL) return;
    const ctrl = new AbortController();
    setLoad({ state: "loading" });
    fetchGroups(session.testVersion, session.testType, ctrl.signal)
      .then(stats => setLoad({ state: "ready", stats, sample: false }))
      .catch(() => { if (!ctrl.signal.aborted) setLoad({ state: "error" }); });
    return () => ctrl.abort();
  }, [session.testVersion, session.testType, attempt]);

  return { load, retry, available: !!API_URL || usingSample };
}

/** The groups big enough to show. */
const shownOf = (load: Load): ShownGroup[] => (load.state === "ready" ? shownGroups(load.stats) : []);

/** The comparison section on the Results page, or nothing in a build with no backend. */
export function GroupComparison({ session, groups: { load, retry, available } }: { session: Session; groups: GroupStats }) {
  if (!available || !session.results) return null;
  return (
    <div className="panel" id="comparison" aria-labelledby="comparison-h">
      <GroupSection testType={session.testType} load={load} own={ownValues(session.results)} retry={retry} heading={<h3 id="comparison-h">{t.groups.heading}</h3>} />
    </div>
  );
}

interface GroupSectionProps {
  testType: TestType;
  load: Load;
  /** The person's values for this run. */
  own: Record<MeasureKey, number | null>;
  /** Offered when loading failed. */
  retry?: () => void;
  heading: ReactNode;
}

/**
 * One run beside the groups of its test type, as they are now: who's in each and how many, the
 * sensitivity bars and threshold charts. How the groups are formed is on the Method page. Both results pages
 * use it, the Results by pseudonym page once per session, so a stored session is always shown beside the
 * current groups, never figures saved with it.
 */
export function GroupSection({ testType, load, own, retry, heading }: GroupSectionProps) {
  const shown = shownOf(load);
  return (
    <>
      {heading}
      {load.state === "loading" && <p className="hint">{t.groups.loading}</p>}
      {load.state === "error" && (
        <>
          <p className="hint">{t.groups.loadFailed}</p>
          {retry && <div className="actions"><button type="button" className="btn secondary" onClick={retry}>{text.common.tryAgain}</button></div>}
        </>
      )}
      {load.state === "ready" && (
        <>
          {load.sample && <p className="banner">{t.groups.sample}</p>}
          <p><Rich text={groupsIntro(testType)} /></p>
          <ul className="cmp-groups">
            {GROUPS.map(g => { const l = groupLine(g, load.stats.groups[g].n); return <li key={g}><strong>{l.name}</strong> {l.rest}</li>; })}
          </ul>
          <p><Rich text={sensitivityNote(shown.length > 0)} /></p>
          <SensitivityBars own={sensitivities(own)} groups={shown} />
          <ThresholdRows shown={shown} own={own} />
        </>
      )}
    </>
  );
}

/** The same results as thresholds, with each group's ranges: below the bars on both results pages. Nothing until a group is big enough to show. */
export function ThresholdRows({ shown, own }: { shown: { group: GroupKey; measures: Record<MeasureKey, Quantiles> }[]; own: Record<MeasureKey, number | null> }) {
  if (shown.length === 0) return null;
  return (
    <section className="threshold-charts">
      <p><Rich text={THRESHOLD_CHARTS_NOTE} /></p>
      <div className="cmp-rows">
        {MEASURES.map(m => <MeasureRow key={m} measure={m} lanes={shown.map(s => ({ group: s.group, q: s.measures[m] }))} value={own[m]} />)}
      </div>
    </section>
  );
}
