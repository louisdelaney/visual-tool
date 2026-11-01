// A person's past results, looked up by pseudonym. The whole dataset is public and the pseudonym
// is the only key, so anyone who enters a pseudonym sees what was sent with it. That's by design:
// anonymity depends on people not putting anything identifying in the pseudonym or text answers.
import type { MeasureKey } from "./comparison";
import type { TaskName, Trial } from "./types";
import { ADJECTIVES, NOUNS } from "./words";

/** One scored trial on a staircase chart. */
export interface StaircasePoint {
  coherence_pct: number;
  correct: boolean;
  reversal: boolean;
}

export type Staircases = Record<TaskName, StaircasePoint[]>;

/** The most points one staircase can have; more means the response is wrong. */
const MAX_POINTS = 300;

/** The points a staircase chart draws: coherence on each scored trial of one task. */
export const staircasePoints = (trials: readonly Trial[], task: TaskName): StaircasePoint[] =>
  trials.filter(t => t.task === task && t.phase === "test")
    .map(t => ({ coherence_pct: Math.round(t.effective_level_pct * 100) / 100, correct: t.correct, reversal: t.reversal }));

/** One past session, as GET /history returns it. */
export interface HistoryEntry {
  submission_id: string;
  started_at: string;
  test_version: number;
  /** Null where that session didn't reach a value. */
  values: Record<MeasureKey, number | null>;
  medications: string[] | null;
  notes: string | null;
  /** Null for a session that has none to show. */
  staircases: Staircases | null;
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
const strsOrNull = (v: unknown): string[] | null | undefined => (v === null ? null : Array.isArray(v) && v.every(x => typeof x === "string") ? v : undefined);

function parsePoints(v: unknown): StaircasePoint[] | null {
  if (!Array.isArray(v) || v.length > MAX_POINTS) return null;
  const out: StaircasePoint[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") return null;
    const o = p as Record<string, unknown>;
    if (!isNum(o.coherence_pct) || typeof o.correct !== "boolean" || typeof o.reversal !== "boolean") return null;
    out.push({ coherence_pct: o.coherence_pct, correct: o.correct, reversal: o.reversal });
  }
  return out;
}

/** Null or missing means none; anything else must be both tasks' points, or undefined (invalid). */
function parseStaircases(v: unknown): Staircases | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const motion = parsePoints(o.motion), form = parsePoints(o.form);
  return motion && form ? { motion, form } : undefined;
}

function parseEntry(v: unknown): HistoryEntry | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.submission_id !== "string" || typeof o.started_at !== "string" || Number.isNaN(Date.parse(o.started_at)) || !isNum(o.test_version)) return null;
  if (!o.values || typeof o.values !== "object") return null;
  const vals = o.values as Record<string, unknown>;
  const m = numOrNull(vals.motion_threshold_pct), f = numOrNull(vals.form_threshold_pct), d = numOrNull(vals.motion_minus_form);
  const medications = strsOrNull(o.medications), notes = strOrNull(o.notes), staircases = parseStaircases(o.staircases);
  if (m === undefined || f === undefined || d === undefined || medications === undefined || notes === undefined || staircases === undefined) return null;
  return { submission_id: o.submission_id, started_at: o.started_at, test_version: o.test_version, values: { motion_threshold_pct: m, form_threshold_pct: f, motion_minus_form: d }, medications, notes, staircases };
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

/** A made-up staircase settling near a threshold, for the sample history only. */
function sampleStaircase(threshold: number, seed: number): StaircasePoint[] {
  let r = seed;
  const rand = (): number => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  const out: StaircasePoint[] = [];
  let level = 60, streak = 0, last: "up" | "down" | null = null;
  for (let i = 0; i < 40; i++) {
    const correct = rand() < 0.5 + 0.5 / (1 + Math.pow(threshold / level, 3));
    let move: "up" | "down" | null = null;
    if (!correct) { move = "up"; streak = 0; } else if (++streak === 3) { move = "down"; streak = 0; }
    const reversal = move !== null && last !== null && move !== last;
    out.push({ coherence_pct: Math.round(level * 100) / 100, correct, reversal });
    if (move) { level = Math.min(100, Math.max(1, move === "up" ? level * 1.25 : level / 1.25)); last = move; }
  }
  return out;
}

/** Made-up history for developing the page before the backend exists. Never shown in a production build. */
export function sampleHistory(pseudonym: string): HistoryResponse {
  const rows: [string, number, number, string[] | null, string | null][] = [
    ["2026-06-02T19:10:00Z", 14.2, 31.5, null, "First test."],
    ["2026-07-05T20:02:00Z", 13.1, 28.9, ["Lamotrigine"], "Started lamotrigine last week."],
    ["2026-08-09T18:45:00Z", 11.8, 24.3, ["Lamotrigine"], null],
    ["2026-09-13T21:15:00Z", 10.9, 23.7, ["Lamotrigine", "Melatonin"], "Snow less noticeable in daylight."],
    ["2026-10-18T19:30:00Z", 10.2, 21.0, ["Lamotrigine"], null],
  ];
  return {
    pseudonym,
    sessions: rows.map(([at, m, f, medications, notes], i) => ({
      submission_id: `sample-${i + 1}`, started_at: at, test_version: 1,
      values: { motion_threshold_pct: m, form_threshold_pct: f, motion_minus_form: Math.round((1 / m - 1 / f) * 1e5) / 1e5 },
      medications, notes,
      staircases: { motion: sampleStaircase(m, 7 + i * 31), form: sampleStaircase(f, 11 + i * 17) },
    })),
  };
}
