// Axes for the results charts, shared by the page's SVG charts and the PDF summaries so both draw
// the same scales.
import type { Quantiles } from "./comparison";

/** The staircase charts' log axis, in coherence %. */
export const LOG_TICKS = [1, 2, 5, 10, 20, 50, 100];

/** Where v sits on the staircase charts' 1–100% log axis: 0 at the bottom, 1 at the top. */
export const logPosition = (v: number): number => Math.log10(Math.min(100, Math.max(1, v))) / 2;

/**
 * A threshold chart's axis, covering every group's range and the person's value, with some room
 * either side. `to` maps a value to 0–1 across the chart.
 */
export function rangeAxis(qs: Quantiles[], value: number | null, log: boolean): { to: (v: number) => number; ticks: number[] } {
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

/** Round ticks (1, 2 or 5 × 10^k) covering lo to hi, at most seven: the sensitivity bars' axis. */
export function roundTicks(lo: number, hi: number): number[] {
  const base = Math.pow(10, Math.floor(Math.log10(hi - lo || 0.1)) - 1);
  const step = [1, 2, 5, 10, 20, 50].map(m => m * base).find(st => Math.ceil(hi / st - 1e-9) - Math.floor(lo / st + 1e-9) + 1 <= 7) ?? 100 * base;
  const out: number[] = [];
  for (let k = Math.floor(lo / step + 1e-9); k <= Math.ceil(hi / step - 1e-9); k++) out.push(Number((k * step).toPrecision(6)));
  return out;
}

/** Enough decimals to tell neighbouring ticks apart, and at least `min`. */
export const tickDecimals = (ticks: number[], min: number): number =>
  ticks.length > 1 ? Math.max(min, -Math.floor(Math.log10(ticks[1]! - ticks[0]!) + 1e-9)) : 2;
