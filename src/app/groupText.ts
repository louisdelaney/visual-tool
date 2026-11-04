// The words for the groups and measures in comparison.ts, on the results pages and in the PDF.
// Kept apart from comparison.ts so the backend, which imports that for the group rules, doesn't
// depend on the site's text.
import type { TestType } from "../core/protocol";
import type { GroupKey, MeasureKey, Quantiles } from "./comparison";
import { fmt } from "./format";
import { text } from "../text";

const t = text.charts;

/** How each group is named on the page, and who is in it. */
export const GROUP_INFO: Record<GroupKey, { name: string; who: string }> = {
  control: t.groups.control,
  psychedelics: t.groups.psychedelics,
};

/** How each measure is named and written, on the page and in the PDF summaries. */
export interface MeasureInfo {
  title: string;
  /** Series colour, matching the staircase charts. */
  series: "motion" | "form" | "diff";
  log: boolean;
  format: (v: number) => string;
  /** What higher or lower means. */
  reading: string;
}

export const MEASURE_INFO: Record<MeasureKey, MeasureInfo> = {
  motion_threshold_pct: { ...t.measures.motion_threshold_pct, series: "motion", log: true, format: v => fmt.pct(v) },
  form_threshold_pct: { ...t.measures.form_threshold_pct, series: "form", log: true, format: v => fmt.pct(v) },
  motion_minus_form: { ...t.measures.motion_minus_form, series: "diff", log: false, format: v => fmt.signed(v, 3) },
};

/** A group's numbers for one measure, in words. */
export const describeQuantiles = (info: MeasureInfo, q: Quantiles): string =>
  t.groups.quantiles(info.format(q.p50), info.format(q.p25), info.format(q.p75), info.format(q.p10), info.format(q.p90));

/** What opens the groups section, before the list of groups. */
export const groupsIntro = (testType: TestType): string => testType === "quick" ? t.groups.introQuick : t.groups.introFull;

/** One line per group in the list: who's in it and how many. */
export const groupLine = (g: GroupKey, n: number): { name: string; rest: string } =>
  ({ name: `${GROUP_INFO[g].name}:`, rest: t.groups.line(GROUP_INFO[g].who, n) });

/** Above the sensitivity bars. */
export const sensitivityNote = (anyShown: boolean): string => t.groups.sensitivityNote(anyShown);

/** Above the threshold charts. */
export const THRESHOLD_CHARTS_NOTE = t.groups.thresholdChartsNote;
