// One measure across a person's past sessions, oldest to newest, over the control group's middle half
// and median when those are available.
import { useRef } from "react";
import type { MeasureKey, Quantiles } from "../app/comparison";
import type { HistoryEntry } from "../app/history";
import { fmt } from "../app/format";
import { useElementWidth } from "../hooks";

interface HistoryChartProps {
  measure: MeasureKey;
  title: string;
  series: "motion" | "form" | "diff";
  sessions: HistoryEntry[];
  controls: Quantiles | null;
}

const H = 200;
const M = { l: 52, r: 16, t: 14, b: 34 };
const LOG_TICKS = [1, 2, 5, 10, 20, 50, 100];

export function HistoryChart({ measure, title, series, sessions, controls }: HistoryChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const W = Math.max(280, Math.round(useElementWidth(hostRef, 320)));
  const log = measure !== "motion_minus_form";
  const format = (v: number): string => (log ? fmt.pct(v) : fmt.signed(v, 3));
  const pts = sessions.flatMap(s => { const v = s.values[measure]; return v == null ? [] : [{ t: Date.parse(s.started_at), v }]; });
  const values = [...pts.map(p => p.v), ...(controls ? [controls.p25, controls.p75] : [])];
  if (!values.length) return null;

  let lo = Math.min(...values), hi = Math.max(...values);
  let to: (v: number) => number, ticks: number[];
  if (log) {
    const a = Math.log10(Math.max(1, lo / 1.3)), b = Math.log10(Math.min(100, hi * 1.3));
    to = v => (Math.log10(Math.min(100, Math.max(1, v))) - a) / (b - a || 1);
    ticks = LOG_TICKS.filter(t => Math.log10(t) >= a - 1e-9 && Math.log10(t) <= b + 1e-9);
  } else {
    const span = hi - lo || 0.02; lo -= span * 0.2; hi += span * 0.2;
    to = v => (v - lo) / (hi - lo);
    const step = [0.005, 0.01, 0.02, 0.05, 0.1].find(st => (hi - lo) / st <= 5) ?? 0.2;
    ticks = [];
    for (let k = Math.ceil(lo / step); k * step <= hi + 1e-12; k++) ticks.push(Number((k * step).toPrecision(6)));
  }
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const y = (v: number): number => M.t + (1 - to(v)) * ih;
  const t0 = Math.min(...pts.map(p => p.t)), t1 = Math.max(...pts.map(p => p.t));
  const x = (t: number): number => M.l + (t1 === t0 ? iw / 2 : ((t - t0) / (t1 - t0)) * iw);
  const label = `${title} over ${pts.length} sessions: ${pts.map(p => format(p.v)).join(", ")}.`;

  return (
    <figure className={`chart-box hist-${series}`}>
      <figcaption><span className="chart-title">{title}</span></figcaption>
      <div className="chart-host" ref={hostRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="hist-chart" role="img" aria-label={label}>
          {controls && (
            <g>
              <rect className="hist-band" x={M.l} width={iw} y={y(controls.p75)} height={Math.max(1, y(controls.p25) - y(controls.p75))} />
              <line className="hist-median" x1={M.l} x2={W - M.r} y1={y(controls.p50)} y2={y(controls.p50)} />
            </g>
          )}
          {ticks.map(t => (
            <g key={t}>
              <line className="hist-grid" x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} />
              <text className="tick" x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end">{log ? `${t}%` : fmt.signed(t, 2)}</text>
            </g>
          ))}
          {pts.length > 1 && <polyline className="hist-line" points={pts.map(p => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")} />}
          {pts.map((p, i) => <circle key={i} className="hist-dot" cx={x(p.t)} cy={y(p.v)} r={4.5} />)}
          <text className="tick" x={M.l} y={H - 8}>{new Date(t0).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</text>
          {t1 !== t0 && <text className="tick" x={W - M.r} y={H - 8} textAnchor="end">{new Date(t1).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</text>}
        </svg>
      </div>
    </figure>
  );
}
