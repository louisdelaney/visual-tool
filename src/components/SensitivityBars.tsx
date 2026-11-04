// Motion, form and motion-minus-form sensitivity as grouped bars, in the style of the clinic's
// "Glass Patterns" chart: the person's three bars first, then each group's. A group's bars are its
// medians, with a line across the middle half. It only shows the numbers: it draws no conclusions
// from where a value falls.
import { useRef } from "react";
import { groupSensitivities, type GroupKey, type MeasureKey, type Quantiles, type Sensitivities, type SensitivityRange } from "../app/comparison";
import { GROUP_INFO } from "../app/groupText";
import { fmt } from "../app/format";
import { roundTicks, tickDecimals } from "../app/scales";
import { useElementWidth } from "../hooks";
import { text } from "../text";

const t = text.charts.bars;

type Series = keyof Sensitivities;

const SERIES: readonly { key: Series; label: string }[] = [
  { key: "motion", label: t.motion },
  { key: "form", label: t.form },
  { key: "diff", label: t.diff },
];

interface Cluster {
  key: string;
  label: string;
  sub: string;
  bars: Record<Series, { value: number | null; range?: SensitivityRange }>;
}

interface SensitivityBarsProps {
  /** The person's sensitivities. */
  own: Sensitivities;
  /** The groups big enough to show, in order. */
  groups: { group: GroupKey; n: number; measures: Record<MeasureKey, Quantiles> }[];
  /** Under the person's bars, e.g. a session date. */
  ownSub?: string;
}

const H = 280;
const M = { l: 62, r: 12, t: 14, b: 46 };

export function SensitivityBars({ own, groups, ownSub }: SensitivityBarsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const W = Math.max(320, Math.round(useElementWidth(hostRef, 640)));

  const clusters: Cluster[] = [
    { key: "you", label: t.thisRun, sub: ownSub ?? "", bars: { motion: { value: own.motion }, form: { value: own.form }, diff: { value: own.diff } } },
    ...groups.map(({ group, n, measures }) => {
      const s = groupSensitivities(measures);
      return {
        key: group,
        label: GROUP_INFO[group].name,
        sub: t.people(n),
        bars: { motion: { value: s.motion.p50, range: s.motion }, form: { value: s.form.p50, range: s.form }, diff: { value: s.diff.p50, range: s.diff } },
      };
    }),
  ];

  const all = clusters.flatMap(c => SERIES.flatMap(({ key }) => { const b = c.bars[key]; return [b.value, b.range?.p25, b.range?.p75]; })).filter((v): v is number => v != null);
  if (!all.length) return null;
  const lo = Math.min(0, ...all), hi = Math.max(0.01, ...all);
  const ticks = roundTicks(lo, hi);
  const yLo = ticks[0]!, yHi = ticks[ticks.length - 1]!;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const y = (v: number): number => M.t + (1 - (v - yLo) / (yHi - yLo)) * ih;
  const cw = iw / clusters.length;
  const bw = Math.min(34, cw * 0.2);
  const decimals = tickDecimals(ticks, 2);

  const describe = (c: Cluster): string => `${c.label}: ` + SERIES.map(({ key, label }) => {
    const b = c.bars[key];
    if (b.value == null) return t.noValue(label);
    return b.range ? t.range(label, fmt.fixed(b.value, 3), fmt.fixed(b.range.p25, 3), fmt.fixed(b.range.p75, 3)) : t.single(label, fmt.fixed(b.value, 3));
  }).join(", ") + ".";

  return (
    <figure className="sens-bars">
      <div className="chart-host" ref={hostRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="sens-chart" role="img" aria-label={t.described(clusters.map(describe).join(" "))}>
          {ticks.map(t => (
            <g key={t}>
              <line className={t === 0 ? "sens-zero" : "sens-grid"} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} />
              <text className="tick" x={M.l - 8} y={y(t) + 4} textAnchor="end">{fmt.fixed(t, decimals)}</text>
            </g>
          ))}
          <text className="sens-axis-label" transform={`translate(13 ${M.t + ih / 2}) rotate(-90)`} textAnchor="middle">{t.axis}</text>
          {clusters.map((c, i) => {
            const cx = M.l + cw * (i + 0.5);
            return (
              <g key={c.key}>
                {SERIES.map(({ key }, j) => {
                  const b = c.bars[key];
                  if (b.value == null) return null;
                  const x = cx + (j - 1) * (bw + 3) - bw / 2;
                  const top = Math.min(y(b.value), y(0)), h = Math.max(1, Math.abs(y(b.value) - y(0)));
                  const wx = x + bw / 2;
                  return (
                    <g key={key} className={`sens-${key}`}>
                      <rect className="sens-bar" x={x} y={top} width={bw} height={h}>
                        <title>{b.range
                          ? t.barTipRange(c.label, SERIES[j]!.label, fmt.fixed(b.value, 3), fmt.fixed(b.range.p25, 3), fmt.fixed(b.range.p75, 3))
                          : t.barTip(c.label, SERIES[j]!.label, fmt.fixed(b.value, 3))}</title>
                      </rect>
                      {b.range && (
                        <g className="sens-whisker">
                          <line x1={wx} x2={wx} y1={y(b.range.p75)} y2={y(b.range.p25)} />
                          <line x1={wx - 5} x2={wx + 5} y1={y(b.range.p75)} y2={y(b.range.p75)} />
                          <line x1={wx - 5} x2={wx + 5} y1={y(b.range.p25)} y2={y(b.range.p25)} />
                        </g>
                      )}
                    </g>
                  );
                })}
                <text className="sens-cluster" x={cx} y={H - M.b + 20} textAnchor="middle">{c.label}</text>
                {c.sub && <text className="sens-sub" x={cx} y={H - M.b + 36} textAnchor="middle">{c.sub}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="chart-key">
        {SERIES.map(({ key, label }) => (
          <span key={key} className={`sens-${key}`}><svg width="12" height="12" aria-hidden="true"><rect className="sens-bar" width="12" height="12" /></svg>{label}</span>
        ))}
      </figcaption>
    </figure>
  );
}
