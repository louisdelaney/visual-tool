// A person's past results, looked up by pseudonym. The whole dataset is public and the pseudonym
// is the only key, so anyone who enters a pseudonym sees what was sent with it. That's by design:
// anonymity depends on people not putting anything identifying in the pseudonym or text answers.
import type { MeasureKey } from "./comparison";
import { ADJECTIVES, NOUNS } from "./words";

/** One past session, as GET /history returns it. */
export interface HistoryEntry {
  submission_id: string;
  started_at: string;
  test_version: number;
  /** Null where that session didn't reach a value. */
  values: Record<MeasureKey, number | null>;
  medications: string | null;
  notes: string | null;
}

export interface HistoryResponse {
  pseudonym: string;
  /** Oldest first. */
  sessions: HistoryEntry[];
}

/**
 * The form pseudonyms are stored and looked up in: trimmed, lower case, inner spaces collapsed.
 * "Quiet Heron" and "quiet heron " are the same pseudonym.
 */
export const normalizePseudonym = (s: string): string => s.trim().replace(/\s+/g, " ").toLowerCase();

/** A random pseudonym of two dictionary words, like "quiet-heron": nothing in it can point to a person. */
export function suggestPseudonym(random: () => number = Math.random): string {
  const pick = (xs: readonly string[]): string => xs[Math.floor(random() * xs.length)]!;
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const numOrNull = (v: unknown): number | null | undefined => (v === null ? null : isNum(v) ? v : undefined);
const strOrNull = (v: unknown): string | null | undefined => (v === null ? null : typeof v === "string" ? v : undefined);

function parseEntry(v: unknown): HistoryEntry | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.submission_id !== "string" || typeof o.started_at !== "string" || Number.isNaN(Date.parse(o.started_at)) || !isNum(o.test_version)) return null;
  if (!o.values || typeof o.values !== "object") return null;
  const vals = o.values as Record<string, unknown>;
  const m = numOrNull(vals.motion_threshold_pct), f = numOrNull(vals.form_threshold_pct), d = numOrNull(vals.motion_minus_form);
  const medications = strOrNull(o.medications), notes = strOrNull(o.notes);
  if (m === undefined || f === undefined || d === undefined || medications === undefined || notes === undefined) return null;
  return { submission_id: o.submission_id, started_at: o.started_at, test_version: o.test_version, values: { motion_threshold_pct: m, form_threshold_pct: f, motion_minus_form: d }, medications, notes };
}

/** Checks a /history response; null if it isn't valid. Server data is untrusted. Sorts oldest first. */
export function parseHistory(v: unknown): HistoryResponse | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.pseudonym !== "string" || !Array.isArray(o.sessions)) return null;
  const sessions: HistoryEntry[] = [];
  for (const s of o.sessions) {
    const e = parseEntry(s);
    if (!e) return null;
    sessions.push(e);
  }
  sessions.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
  return { pseudonym: o.pseudonym, sessions };
}

/** Made-up history for developing the page before the backend exists. Never shown in a production build. */
export function sampleHistory(pseudonym: string): HistoryResponse {
  const rows: [string, number, number, string | null, string | null][] = [
    ["2026-06-02T19:10:00Z", 14.2, 31.5, null, "First test."],
    ["2026-07-05T20:02:00Z", 13.1, 28.9, "Lamotrigine 25 mg", "Started lamotrigine last week."],
    ["2026-08-09T18:45:00Z", 11.8, 24.3, "Lamotrigine 50 mg", null],
    ["2026-09-13T21:15:00Z", 10.9, 23.7, "Lamotrigine 50 mg", "Snow less noticeable in daylight."],
    ["2026-10-18T19:30:00Z", 10.2, 21.0, "Lamotrigine 50 mg", null],
  ];
  return {
    pseudonym,
    sessions: rows.map(([at, m, f, medications, notes], i) => ({
      submission_id: `sample-${i + 1}`, started_at: at, test_version: 1,
      values: { motion_threshold_pct: m, form_threshold_pct: f, motion_minus_form: Math.round((1 / m - 1 / f) * 1e5) / 1e5 },
      medications, notes,
    })),
  };
}
