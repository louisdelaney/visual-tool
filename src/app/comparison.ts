// A person's results beside two groups of people who contributed and said they don't have or
// suspect a visual perceptual disorder: the control group, who have never used psychedelic drugs,
// and those who have. The backend sends only summary numbers (a count and percentiles), never
// anyone's individual results.
import type { Results } from "./types";

/** A group isn't shown below this many people: too few to mean much, and too few to keep individuals hidden. */
export const MIN_GROUP = 30;

export interface Quantiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export type MeasureKey = "motion_threshold_pct" | "form_threshold_pct" | "motion_minus_form";

export const MEASURES: readonly MeasureKey[] = ["motion_threshold_pct", "form_threshold_pct", "motion_minus_form"];

export type GroupKey = "control" | "psychedelics";

export const GROUPS: readonly GroupKey[] = ["control", "psychedelics"];

/** How each group is named on the page, and who is in it. */
export const GROUP_INFO: Record<GroupKey, { name: string; who: string }> = {
  control: { name: "Control group", who: "no visual perceptual disorder, never used psychedelic drugs" },
  psychedelics: { name: "Used psychedelics", who: "no visual perceptual disorder, have used psychedelic drugs" },
};

/** One group's summary. measures is null while n < MIN_GROUP. */
export interface GroupStats {
  /** People in the group with complete sessions on this test version. */
  n: number;
  measures: Record<MeasureKey, Quantiles> | null;
}

/** GET /groups: summary statistics for each group on one test version. */
export interface GroupsResponse {
  test_version: number;
  groups: Record<GroupKey, GroupStats>;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function parseQuantiles(v: unknown): Quantiles | null {
  if (!v || typeof v !== "object") return null;
  const q = v as Record<string, unknown>;
  const keys = ["p10", "p25", "p50", "p75", "p90"] as const;
  if (!keys.every(k => isNum(q[k]))) return null;
  const out = { p10: q.p10, p25: q.p25, p50: q.p50, p75: q.p75, p90: q.p90 } as Quantiles;
  // Percentiles must be in order, or the response is wrong.
  return out.p10 <= out.p25 && out.p25 <= out.p50 && out.p50 <= out.p75 && out.p75 <= out.p90 ? out : null;
}

function parseGroup(v: unknown): GroupStats | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!isNum(o.n) || o.n < 0) return null;
  if (o.measures === null) return { n: o.n, measures: null };
  if (!o.measures || typeof o.measures !== "object") return null;
  const m = o.measures as Record<string, unknown>;
  const measures = {} as Record<MeasureKey, Quantiles>;
  for (const key of MEASURES) {
    const q = parseQuantiles(m[key]);
    if (!q) return null;
    measures[key] = q;
  }
  return { n: o.n, measures };
}

/** Checks a /groups response. Returns null if it isn't valid: server data is untrusted. */
export function parseGroups(v: unknown): GroupsResponse | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!isNum(o.test_version) || !o.groups || typeof o.groups !== "object") return null;
  const g = o.groups as Record<string, unknown>;
  const groups = {} as Record<GroupKey, GroupStats>;
  for (const key of GROUPS) {
    const stats = parseGroup(g[key]);
    if (!stats) return null;
    groups[key] = stats;
  }
  return { test_version: o.test_version, groups };
}

/** A group's measures if it's big enough to show, otherwise null. */
export const shownMeasures = (g: GroupStats): Record<MeasureKey, Quantiles> | null =>
  g.n >= MIN_GROUP ? g.measures : null;

/** The person's value for each measure, or null where their run didn't reach a threshold. */
export function ownValues(r: Results): Record<MeasureKey, number | null> {
  return {
    motion_threshold_pct: r.motion?.threshold_pct ?? null,
    form_threshold_pct: r.form?.threshold_pct ?? null,
    motion_minus_form: r.motion_minus_form?.sensitivity ?? null,
  };
}

/** Made-up numbers for developing the charts before the backend exists. Never shown in a production build. */
export const SAMPLE_GROUPS: GroupsResponse = {
  test_version: 1,
  groups: {
    control: {
      n: 64,
      measures: {
        motion_threshold_pct: { p10: 6.1, p25: 7.9, p50: 10.2, p75: 13.4, p90: 17.8 },
        form_threshold_pct: { p10: 11.5, p25: 14.6, p50: 18.9, p75: 24.0, p90: 31.2 },
        motion_minus_form: { p10: -0.012, p25: 0.018, p50: 0.044, p75: 0.071, p90: 0.102 },
      },
    },
    psychedelics: {
      n: 41,
      measures: {
        motion_threshold_pct: { p10: 6.4, p25: 8.3, p50: 10.9, p75: 14.1, p90: 19.0 },
        form_threshold_pct: { p10: 12.0, p25: 15.2, p50: 19.6, p75: 25.3, p90: 32.8 },
        motion_minus_form: { p10: -0.015, p25: 0.014, p50: 0.040, p75: 0.068, p90: 0.099 },
      },
    },
  },
};
