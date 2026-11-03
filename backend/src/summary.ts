// What's derived from a session when it's stored: the small row /history reads, and which
// comparison group (if any) its measures join. The group rules are the README's: both tasks
// complete, no reported disorder, then psychedelic use "no" → control, "yes" → psychedelics.
// Anyone else is in neither. People who reported a disorder are never grouped (AGENTS.md).
import type { GroupKey, MeasureKey } from "../../src/app/comparison";
import type { HistoryEntry, Staircases } from "../../src/app/history";
import { normalizePseudonym, runInfoOf, staircasePoints, type RunInfo } from "../../src/app/history";
import { testTypeOf, toHour, type AnySessionExport } from "../../src/app/schema";
import type { AgeRange, ContributionAnswers } from "../../src/app/types";
import type { TestType } from "../../src/core/protocol";

/**
 * One row in the `summaries` collection: every answer the person gave, beside the measures.
 * perceptual_disorder is stored as `disorder`, the name rows have had from the start. Rows from
 * before the quick test have no test_type, and rows from before schema 3 have no age_range and may
 * have no months_since_psychedelics.
 */
export interface SummaryRow extends Omit<HistoryEntry, "test_type" | "answers" | "run">, Omit<ContributionAnswers, "pseudonym" | "perceptual_disorder" | "medications" | "notes" | "age_range" | "months_since_psychedelics"> {
  test_type?: TestType;
  age_range?: AgeRange | null;
  months_since_psychedelics?: number | null;
  /** Rows from before it was kept have none. */
  run?: RunInfo;
  pseudonym: string | null;
  disorder: ContributionAnswers["perceptual_disorder"];
}

/** The three measures of a session, null where it didn't reach a value. */
export function measuresOf(s: AnySessionExport): Record<MeasureKey, number | null> {
  const r = s.results;
  return {
    motion_threshold_pct: r?.motion?.threshold_pct ?? null,
    form_threshold_pct: r?.form?.threshold_pct ?? null,
    motion_minus_form: r?.motion_minus_form?.sensitivity ?? null,
  };
}

/** The points each staircase chart draws. */
export const staircasesOf = (s: AnySessionExport): Staircases =>
  ({ motion: staircasePoints(s.trials, "motion"), form: staircasePoints(s.trials, "form") });

function answersOf(s: AnySessionExport) {
  return s.contribution && s.contribution.contribute ? s.contribution.answers : null;
}

export function summaryRow(s: AnySessionExport, submissionId: string): SummaryRow {
  const a = answersOf(s);
  const raw = a?.pseudonym?.trim() ? normalizePseudonym(a.pseudonym) : "";
  return {
    submission_id: submissionId,
    pseudonym: raw || null,
    started_at: s.started_at,
    test_version: s.test_version,
    test_type: testTypeOf(s),
    // Answers sent before schema 3 have no age_range.
    age_range: (a as Partial<ContributionAnswers> | null)?.age_range ?? null,
    disorder: a?.perceptual_disorder ?? null,
    condition: a?.condition ?? null,
    other_condition: a?.other_condition ?? null,
    diagnosed: a?.diagnosed ?? null,
    psychedelics: a?.psychedelics ?? null,
    psychedelic_uses: a?.psychedelic_uses ?? null,
    months_since_psychedelics: a?.months_since_psychedelics ?? null,
    psychedelics_used: a?.psychedelics_used ?? null,
    takes_medication: a?.takes_medication ?? null,
    found_via: a?.found_via ?? null,
    found_via_other: a?.found_via_other ?? null,
    values: measuresOf(s),
    medications: a?.medications ?? null,
    notes: a?.notes ?? null,
    staircases: staircasesOf(s),
    run: runInfoOf(s),
  };
}

/** The group this session's measures join, or null. Only complete sessions with all three values count. */
export function groupOf(s: AnySessionExport): GroupKey | null {
  const a = answersOf(s);
  if (!a || a.perceptual_disorder !== "no") return null;
  if (s.results?.motion?.status !== "complete" || s.results?.form?.status !== "complete") return null;
  const m = measuresOf(s);
  if (m.motion_threshold_pct === null || m.form_threshold_pct === null || m.motion_minus_form === null) return null;
  if (a.psychedelics === "no") return "control";
  if (a.psychedelics === "yes") return "psychedelics";
  return null;
}

/** The values a grouped session added to its group's arrays. Only call it when groupOf(s) isn't null. */
export function groupValuesOf(s: AnySessionExport): { motion: number; form: number; diff: number } {
  const m = measuresOf(s);
  return { motion: m.motion_threshold_pct!, form: m.form_threshold_pct!, diff: m.motion_minus_form! };
}

/**
 * Strips a stored row down to a `HistoryEntry`: what GET /history returns, with the answers so the
 * questions page can fill them in again. Everything but the pseudonym is already public in the
 * export. Rows stored before staircases or run info were kept send them as null. Rows stored
 * before the quick test have no test type: they're all the full test.
 */
export function historyEntry(row: SummaryRow): HistoryEntry {
  const staircases: Staircases | null = row.staircases ?? null;
  const run = row.run ?? null;
  const answers = {
    age_range: row.age_range ?? null,
    perceptual_disorder: row.disorder ?? null,
    condition: row.condition ?? null,
    other_condition: row.other_condition ?? null,
    diagnosed: row.diagnosed ?? null,
    psychedelics: row.psychedelics ?? null,
    psychedelic_uses: row.psychedelic_uses ?? null,
    months_since_psychedelics: row.months_since_psychedelics ?? null,
    psychedelics_used: row.psychedelics_used ?? null,
    takes_medication: row.takes_medication ?? null,
    found_via: row.found_via ?? null,
    found_via_other: row.found_via_other ?? null,
  };
  // Rows stored before times were cut to the hour have the exact time: never send it.
  return { submission_id: row.submission_id, started_at: toHour(row.started_at), test_version: row.test_version, test_type: testTypeOf(row), values: row.values, medications: row.medications, notes: row.notes, staircases, answers, run };
}
