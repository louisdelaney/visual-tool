// What's derived from a session when it's stored: the small row /history reads, and which
// comparison group (if any) its measures join. The group rules are the README's: both tasks
// complete, no reported disorder, then psychedelic use "no" → control, "yes" → psychedelics.
// Anyone else is in neither. People who reported a disorder are never grouped (AGENTS.md).
import type { GroupKey, MeasureKey } from "../../src/app/comparison";
import type { HistoryEntry } from "../../src/app/history";
import { normalizePseudonym } from "../../src/app/history";
import type { SessionExportV1 } from "../../src/app/schema";

/** One row in the `summaries` collection. */
export interface SummaryRow extends HistoryEntry {
  pseudonym: string | null;
  disorder: "yes" | "no" | null;
  psychedelics: "yes" | "no" | "prefer-not-to-say" | null;
}

/** The three measures of a session, null where it didn't reach a value. */
export function measuresOf(s: SessionExportV1): Record<MeasureKey, number | null> {
  const r = s.results;
  return {
    motion_threshold_pct: r?.motion?.threshold_pct ?? null,
    form_threshold_pct: r?.form?.threshold_pct ?? null,
    motion_minus_form: r?.motion_minus_form?.sensitivity ?? null,
  };
}

function answersOf(s: SessionExportV1) {
  return s.contribution && s.contribution.contribute ? s.contribution.answers : null;
}

export function summaryRow(s: SessionExportV1, submissionId: string): SummaryRow {
  const a = answersOf(s);
  const raw = a?.pseudonym?.trim() ? normalizePseudonym(a.pseudonym) : "";
  return {
    submission_id: submissionId,
    pseudonym: raw || null,
    started_at: s.started_at,
    test_version: s.test_version,
    disorder: a?.perceptual_disorder ?? null,
    psychedelics: a?.psychedelics ?? null,
    values: measuresOf(s),
    medications: a?.medications ?? null,
    notes: a?.notes ?? null,
  };
}

/** The group this session's measures join, or null. Only complete sessions with all three values count. */
export function groupOf(s: SessionExportV1): GroupKey | null {
  const a = answersOf(s);
  if (!a || a.perceptual_disorder !== "no") return null;
  if (s.results?.motion?.status !== "complete" || s.results?.form?.status !== "complete") return null;
  const m = measuresOf(s);
  if (m.motion_threshold_pct === null || m.form_threshold_pct === null || m.motion_minus_form === null) return null;
  if (a.psychedelics === "no") return "control";
  if (a.psychedelics === "yes") return "psychedelics";
  return null;
}

/** Strips the ordering of a `HistoryEntry` from a stored row: what GET /history returns. */
export function historyEntry(row: SummaryRow): HistoryEntry {
  return { submission_id: row.submission_id, started_at: row.started_at, test_version: row.test_version, values: row.values, medications: row.medications, notes: row.notes };
}
