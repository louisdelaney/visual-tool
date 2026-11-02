// One task's staircase: coherence on each scored trial (log scale), reversals circled, and the
// threshold line. Hovering snaps a crosshair and tooltip to the nearest trial.
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { TaskName } from "../app/types";
import type { StaircasePoint } from "../app/history";
import { fmt } from "../app/format";
import { useElementWidth } from "../hooks";

interface StaircaseChartProps {
  task: TaskName;
  points: StaircasePoint[];
  /** The threshold line, or null where the run didn't reach one. */
  threshold: number | null;
  subtitle: string;
}

const H = 230;
const M = { l: 40, r: 80, t: 14, b: 34 };
const Y_TICKS = [1, 2, 5, 10, 20, 50, 100];

export function StaircaseChart({ task, points: tr, threshold, subtitle }: StaircaseChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(hostRef, 320);
  const [hover, setHover] = useState<{ i: number; left: number; top: number } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // The tooltip is fixed to the viewport, so it would drift away from its point on scroll.
  useEffect(() => {
    if (!hover) return;
    const hide = (): void => setHover(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [hover]);

  const W = Math.max(280, Math.round(width));
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const n = tr.length;
  const x = (i: number): number => M.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number): number => M.t + (1 - Math.log10(Math.min(100, Math.max(1, v))) / 2) * ih;
  const val = (t: StaircasePoint): number => t.coherence_pct;
  const name = task === "motion" ? "Motion" : "Form";
  const label = `${name} staircase: ${n} scored trials, threshold ${threshold != null ? fmt.pct(threshold) : "not reached"}`;
  const step = n > 30 ? 10 : 5;
  const xTicks: number[] = [];
  for (let k = step; k <= n; k += step) xTicks.push(k);

  const onPointer = (e: PointerEvent<SVGRectElement>): void => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || !n) return;
    const r = svg.getBoundingClientRect();
    const k = r.width / W;
    const sx = (e.clientX - r.left) / k;
    const i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((sx - M.l) / iw) * (n - 1))));
    const px = r.left + x(i) * k, py = r.top + y(val(tr[i]!)) * k;
    const tw = tipRef.current?.offsetWidth ?? 160, th = tipRef.current?.offsetHeight ?? 24;
    let left = px + 12, top = py - th - 12;
    if (left + tw > window.innerWidth - 8) left = px - tw - 12;
    if (top < 8) top = py + 14;
    setHover({ i, left, top });
  };

  const hovered = hover ? tr[hover.i] : undefined;

  return (
    <figure className="chart-box">
      <figcaption>
        <span className="chart-title">{name}</span>
        <span className="chart-sub">{subtitle}</span>
      </figcaption>
      <div className="chart-host" ref={hostRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={`chart ${task}`} role="img" aria-label={label}>
          {Y_TICKS.map(t => (
            <g key={t}>
              <line className="grid" x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} />
              <text className="tick" x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
            </g>
          ))}
          <line className="axis" x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} />
          {xTicks.map(k => (
            <g key={k}>
              <line className="xtick" x1={x(k - 1)} x2={x(k - 1)} y1={H - M.b} y2={H - M.b + 4} />
              <text className="tick" x={x(k - 1)} y={H - M.b + 16} textAnchor="middle">{k}</text>
            </g>
          ))}
          <text className="axis-label" x={M.l} y={H - 4}>Trial</text>
          {hover && <line className="crosshair" x1={x(hover.i)} x2={x(hover.i)} y1={M.t} y2={H - M.b} />}
          {threshold != null && (
            <g>
              <line className="thr" x1={M.l} x2={W - M.r} y1={y(threshold)} y2={y(threshold)} />
              <text className="thr-label" x={W - M.r + 8} y={y(threshold)} dy="-0.25em">Threshold</text>
              <text className="thr-value" x={W - M.r + 8} y={y(threshold)} dy="1em">{fmt.pct(threshold)}</text>
            </g>
          )}
          {n > 0 && <polyline className="line" points={tr.map((t, i) => `${x(i).toFixed(1)},${y(val(t)).toFixed(1)}`).join(" ")} />}
          {tr.map((t, i) => t.reversal && <circle key={`r${i}`} className="rev" cx={x(i)} cy={y(val(t))} r={7.5} />)}
          {tr.map((t, i) => <circle key={`m${i}`} className={`mk ${t.correct ? "ok" : "miss"}`} cx={x(i)} cy={y(val(t))} r={4} />)}
          {n > 0 && (
            <rect className="hover-zone" x={M.l - 8} y={M.t} width={iw + 16} height={ih}
              onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setHover(null)} />
          )}
        </svg>
      </div>
      <div className="tip" role="tooltip" ref={tipRef} hidden={!hovered} style={hover ? { left: hover.left, top: hover.top } : undefined}>
        {hovered && hover && `Trial ${hover.i + 1} · ${fmt.pct(val(hovered))} · ${hovered.correct ? "correct" : "wrong"}${hovered.reversal ? " · reversal" : ""}`}
      </div>
    </figure>
  );
}

/** What the marks on a staircase chart mean. */
export function StaircaseKey() {
  return (
    <div className="chart-key" aria-hidden="true">
      <span><svg width="14" height="14" viewBox="0 0 14 14"><circle className="k-ok" cx="7" cy="7" r="4" /></svg>Correct</span>
      <span><svg width="14" height="14" viewBox="0 0 14 14"><circle className="k-miss" cx="7" cy="7" r="4" /></svg>Wrong</span>
      <span><svg width="18" height="18" viewBox="0 0 18 18"><circle className="k-rev" cx="9" cy="9" r="7.5" /></svg>Reversal</span>
      <span><svg width="20" height="10" viewBox="0 0 20 10"><line className="k-thr" x1="0" x2="20" y1="5" y2="5" /></svg>Threshold, averaged from the last reversals</span>
    </div>
  );
}
