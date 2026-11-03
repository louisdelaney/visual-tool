// A person's past results, looked up by pseudonym. The whole dataset is public and the pseudonym
// is the only key, so anyone who enters a pseudonym sees what was sent with it. That's by design:
// anonymity depends on people not putting anything identifying in the pseudonym or text answers.
import type { MeasureKey } from "./comparison";
import { TEST_TYPES, TEST_VERSION, type TestType } from "../core/protocol";
import { AGE_RANGES, type AgeRange, type Condition, type ContributionAnswers, type DeviceKind, type FoundVia, type PsychedelicUse, type TaskName, type TaskResult, type Trial, type YesNo } from "./types";
import type { AnySessionExport } from "./schema";
import { ADJECTIVES, NOUNS } from "./words";
import { fmt } from "./format";

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

/** How a run went and how it was taken: what helps someone tell whether two runs can be read alike. */
export interface RunInfo {
  /** Each task's status, or null where it wasn't run. */
  status: Record<TaskName, TaskResult["status"] | null>;
  /** Easy check trials answered wrongly, across both tasks. */
  checks_missed: number;
  /** A computer, or a tablet standing in for one. */
  device: Exclude<DeviceKind, "phone">;
  /** Viewing distance, or null if it wasn't measured. */
  distance_cm: number | null;
  /** Whether the tasks ran full screen, or null if that wasn't recorded. */
  fullscreen: boolean | null;
}

/** A session's run info. Sessions from before the device type was recorded all came from computers. */
export function runInfoOf(s: AnySessionExport): RunInfo {
  const r = s.results;
  const missed = [r?.motion, r?.form].reduce((n, t) => n + (t ? t.catch_total - t.catch_correct : 0), 0);
  const device = s.environment?.device === "tablet" ? "tablet" : "computer";
  return { status: { motion: r?.motion?.status ?? null, form: r?.form?.status ?? null }, checks_missed: missed, device, distance_cm: s.viewing_distance?.cm ?? null, fullscreen: s.display?.fullscreen ?? null };
}

/** The sentence both results pages show when easy check trials were answered wrongly. */
export const missedChecksText = (missed: number): string =>
  `${missed === 1 ? "One" : missed} of the easy check trials ${missed === 1 ? "was" : "were"} answered wrongly. That can mean lapses of attention or a display problem, so treat these thresholds with caution.`;

/** "Computer · 55 cm away · full screen", leaving out what wasn't recorded. */
export function takenOn(run: RunInfo): string {
  const parts = [run.device === "tablet" ? "Tablet" : "Computer"];
  if (run.distance_cm != null) parts.push(`${fmt.fixed(run.distance_cm, 0)} cm away`);
  if (run.fullscreen != null) parts.push(run.fullscreen ? "full screen" : "not full screen");
  return parts.join(" · ");
}

/** The answers sent with a past session, for filling the questions in again. Medications and notes are the entry's own fields. */
export type PreviousAnswers = Omit<ContributionAnswers, "pseudonym" | "medications" | "notes">;

/** One past session, as GET /history returns it. */
export interface HistoryEntry {
  submission_id: string;
  started_at: string;
  test_version: number;
  /** Full or quick. Sessions from before the quick test are all full. */
  test_type: TestType;
  /** Null where that session didn't reach a value. */
  values: Record<MeasureKey, number | null>;
  medications: string[] | null;
  notes: string | null;
  /** Null for a session that has none to show. */
  staircases: Staircases | null;
  /** Null from a backend that doesn't send them. */
  answers: PreviousAnswers | null;
  /** Null from a backend that doesn't send it. */
  run: RunInfo | null;
}

/** One past session in full, as GET /history/sessions returns it: the same as in the public export. */
export type RawSession = AnySessionExport & { submission_id: string };

/** GET /history/sessions: every session sent with a pseudonym, in full, oldest first. */
export interface RawHistory {
  pseudonym: string;
  sessions: RawSession[];
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

const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null | undefined =>
  v === null || v === undefined ? null : (allowed as readonly unknown[]).includes(v) ? (v as T) : undefined;

const YES_NO: readonly YesNo[] = ["yes", "no"];

const STATUSES: readonly TaskResult["status"][] = ["complete", "incomplete", "not reached"];

/** The run info, or null if it's missing or anything in it isn't valid: the page then just leaves it out. */
function parseRun(v: unknown): RunInfo | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const st = (o.status && typeof o.status === "object" ? o.status : {}) as Record<string, unknown>;
  const motion = oneOf(st.motion, STATUSES), form = oneOf(st.form, STATUSES);
  const device = oneOf(o.device, ["computer", "tablet"] as const), distance = numOrNull(o.distance_cm ?? null);
  const fullscreen = o.fullscreen === null || o.fullscreen === undefined ? null : typeof o.fullscreen === "boolean" ? o.fullscreen : undefined;
  if (motion === undefined || form === undefined || !device || distance === undefined || fullscreen === undefined) return null;
  if (!isNum(o.checks_missed) || !Number.isInteger(o.checks_missed) || o.checks_missed < 0) return null;
  return { status: { motion, form }, checks_missed: o.checks_missed, device, distance_cm: distance, fullscreen };
}

/** Checks a /history/sessions response just enough to save it and build summaries from it; null if it isn't valid. */
export function parseRawHistory(v: unknown): RawHistory | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.pseudonym !== "string" || !Array.isArray(o.sessions)) return null;
  const ok = o.sessions.every(s => !!s && typeof s === "object" && typeof (s as Record<string, unknown>).submission_id === "string"
    && typeof (s as Record<string, unknown>).started_at === "string" && Array.isArray((s as Record<string, unknown>).trials));
  return ok ? { pseudonym: o.pseudonym, sessions: o.sessions as RawSession[] } : null;
}

/** The answers, or null if they're missing or anything in them isn't valid: they only ever fill a form in. */
function parseAnswers(v: unknown): PreviousAnswers | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const uses = numOrNull(o.psychedelic_uses ?? null);
  // A backend from before schema 3 sends neither this nor age_range.
  const since = numOrNull(o.months_since_psychedelics ?? null);
  const a = {
    age_range: oneOf<AgeRange>(o.age_range, AGE_RANGES),
    perceptual_disorder: oneOf<YesNo>(o.perceptual_disorder, YES_NO),
    condition: oneOf<Condition>(o.condition, ["vss", "hppd", "other"]),
    other_condition: strOrNull(o.other_condition ?? null),
    diagnosed: oneOf<YesNo>(o.diagnosed, YES_NO),
    psychedelics: oneOf<PsychedelicUse>(o.psychedelics, ["yes", "no", "prefer-not-to-say"]),
    psychedelic_uses: uses === undefined || (uses !== null && !Number.isInteger(uses)) ? undefined : uses,
    months_since_psychedelics: since === undefined || (since !== null && !(Number.isInteger(since) && since >= 0)) ? undefined : since,
    psychedelics_used: strsOrNull(o.psychedelics_used ?? null),
    takes_medication: oneOf<YesNo>(o.takes_medication, YES_NO),
    found_via: oneOf<FoundVia>(o.found_via, ["reddit", "forum", "other"]),
    found_via_other: strOrNull(o.found_via_other ?? null),
  };
  return Object.values(a).includes(undefined) ? null : (a as PreviousAnswers);
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
  // A backend from before the quick test sends no test type: every session it has is full.
  const testType = o.test_type ?? "full";
  if (!(TEST_TYPES as readonly unknown[]).includes(testType)) return null;
  return { submission_id: o.submission_id, started_at: o.started_at, test_version: o.test_version, test_type: testType as TestType, values: { motion_threshold_pct: m, form_threshold_pct: f, motion_minus_form: d }, medications, notes, staircases, answers: parseAnswers(o.answers), run: parseRun(o.run) };
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
      submission_id: `sample-${i + 1}`, started_at: at, test_version: TEST_VERSION, test_type: i === 3 ? "quick" : "full",
      values: { motion_threshold_pct: m, form_threshold_pct: f, motion_minus_form: Math.round((1 / m - 1 / f) * 1e5) / 1e5 },
      medications, notes,
      staircases: { motion: sampleStaircase(m, 7 + i * 31), form: sampleStaircase(f, 11 + i * 17) },
      answers: null,
      run: { status: { motion: "complete", form: i === 2 ? "incomplete" : "complete" }, checks_missed: i === 1 ? 1 : 0, device: i === 3 ? "tablet" : "computer", distance_cm: 52 + i, fullscreen: i !== 4 },
    })),
  };
}
