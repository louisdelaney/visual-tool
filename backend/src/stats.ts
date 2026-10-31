// Group statistics from the flat value arrays in the `groups/{test_version}` document. The page
// checks that percentiles are in order and that measures is null under MIN_GROUP, so this
// produces exactly that shape.
import { GROUPS, MEASURES, MIN_GROUP, type GroupKey, type GroupStats, type GroupsResponse, type MeasureKey, type Quantiles } from "../../src/app/comparison";

/** The three value arrays stored per group, in the order sessions arrived. */
export interface GroupValues {
  motion: number[];
  form: number[];
  diff: number[];
}

/** The `groups/{test_version}` document. */
export type GroupsDoc = Partial<Record<GroupKey, GroupValues>>;

export const emptyGroupValues = (): GroupValues => ({ motion: [], form: [], diff: [] });

const FIELD: Record<MeasureKey, keyof GroupValues> = { motion_threshold_pct: "motion", form_threshold_pct: "form", motion_minus_form: "diff" };

/** Linear interpolation between order statistics (R's type 7, the usual default). Values needn't be sorted. */
export function quantile(values: readonly number[], p: number): number {
  if (!values.length) throw new Error("quantile of nothing");
  const v = values.slice().sort((a, b) => a - b);
  const h = (v.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, v.length - 1);
  return v[lo]! + (h - lo) * (v[hi]! - v[lo]!);
}

export function quantiles(values: readonly number[]): Quantiles {
  return { p10: quantile(values, 0.1), p25: quantile(values, 0.25), p50: quantile(values, 0.5), p75: quantile(values, 0.75), p90: quantile(values, 0.9) };
}

export function groupStats(g: GroupValues | undefined): GroupStats {
  const n = g?.motion.length ?? 0;
  if (!g || n < MIN_GROUP) return { n, measures: null };
  const measures = {} as Record<MeasureKey, Quantiles>;
  for (const key of MEASURES) measures[key] = quantiles(g[FIELD[key]]);
  return { n, measures };
}

export function groupsResponse(testVersion: number, doc: GroupsDoc | undefined): GroupsResponse {
  const groups = {} as Record<GroupKey, GroupStats>;
  for (const key of GROUPS) groups[key] = groupStats(doc?.[key]);
  return { test_version: testVersion, groups };
}
