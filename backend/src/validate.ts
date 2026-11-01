// Checks a POST /sessions body before it's stored. The body is kept as sent, so this doesn't
// rebuild it field by field: it checks the things the groups and histories depend on, and that
// the session could have come from a real run. Anything else passes through.
import { SCHEMA_NAME, SCHEMA_VERSION, type SessionExportV1 } from "../../src/app/schema";
import { TEST_VERSION } from "../../src/core/protocol";

/** Bodies above this are refused before they're parsed. A real session is about 65 KB. */
export const MAX_BODY_BYTES = 200_000;

/** Free-text answers are capped: they're public, and the page's own boxes are shorter than this. */
const MAX_TEXT = 2_000;
/** List answers (medications, psychedelics used): the page allows 20 entries of 100 characters. */
const MAX_LIST = 20;
const MAX_ENTRY = 100;
const MAX_PSEUDONYM = 60;

/** A run takes about ten minutes; outside these bounds it isn't one. */
const MIN_RUN_MS = 60_000;
const MAX_RUN_MS = 90 * 60_000;

/** Two tasks, each at most 4 practice + 150 staircase + catch trials. */
const MAX_TRIALS = 400;
/** A complete task has stopped at 10 reversals, so it has at least this many scored trials. */
const MIN_COMPLETE_TRIALS = 10;

export type Validation = { ok: true; session: SessionExportV1 } | { ok: false; reason: string };

const bad = (reason: string): Validation => ({ ok: false, reason });
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));
const textOk = (v: unknown, max: number): boolean => v === null || v === undefined || (typeof v === "string" && v.length <= max);
const listOk = (v: unknown): boolean => v === null || v === undefined || (Array.isArray(v) && v.length >= 1 && v.length <= MAX_LIST && v.every(x => typeof x === "string" && x.length >= 1 && x.length <= MAX_ENTRY));

function checkTask(name: string, t: unknown): string | null {
  if (t === null) return null;
  if (!isObj(t)) return `results.${name} must be an object or null`;
  if (t.status !== "complete" && t.status !== "incomplete" && t.status !== "not reached") return `results.${name}.status is not a known status`;
  if (t.threshold_pct !== null && !(isNum(t.threshold_pct) && t.threshold_pct > 0 && t.threshold_pct <= 100)) return `results.${name}.threshold_pct must be null or in (0, 100]`;
  if (t.status === "complete") {
    if (!isNum(t.threshold_pct)) return `results.${name} is complete but has no threshold`;
    if (!isNum(t.staircase_trials) || t.staircase_trials < MIN_COMPLETE_TRIALS) return `results.${name} is complete with too few trials`;
  }
  return null;
}

export function validateSession(body: unknown): Validation {
  if (!isObj(body)) return bad("body must be a JSON object");
  if (body.schema !== SCHEMA_NAME) return bad(`schema must be "${SCHEMA_NAME}"`);
  if (body.schema_version !== SCHEMA_VERSION) return bad(`schema_version ${String(body.schema_version)} is not supported`);
  // Only the current test is accepted, so every stored session can join the one set of groups.
  if (body.test_version !== TEST_VERSION) return bad(`test_version must be ${TEST_VERSION}, the current test`);

  if (!isDate(body.started_at)) return bad("started_at must be a date");
  if (body.finished_at !== null && !isDate(body.finished_at)) return bad("finished_at must be a date or null");
  if (typeof body.finished_at === "string") {
    const ms = Date.parse(body.finished_at) - Date.parse(body.started_at);
    if (ms < MIN_RUN_MS || ms > MAX_RUN_MS) return bad("the run's duration isn't plausible");
  }

  if (!isObj(body.contribution) || body.contribution.contribute !== true) return bad("only contributed sessions are accepted");
  const answers = body.contribution.answers;
  if (!isObj(answers)) return bad("contribution.answers must be an object");
  if (!textOk(answers.pseudonym, MAX_PSEUDONYM)) return bad("pseudonym is too long");
  for (const key of ["notes", "other_condition", "found_via_other"]) {
    if (!textOk(answers[key], MAX_TEXT)) return bad(`${key} is too long`);
  }
  for (const key of ["medications", "psychedelics_used"]) {
    if (!listOk(answers[key])) return bad(`${key} must be null or a list of 1 to ${MAX_LIST} short strings`);
  }
  const yesNo = (v: unknown): boolean => v === null || v === "yes" || v === "no";
  if (!yesNo(answers.perceptual_disorder)) return bad("perceptual_disorder must be yes, no or null");
  if (!(yesNo(answers.psychedelics) || answers.psychedelics === "prefer-not-to-say")) return bad("psychedelics must be yes, no, prefer-not-to-say or null");

  if (!isObj(body.results)) return bad("results must be an object");
  for (const task of ["motion", "form"] as const) {
    const problem = checkTask(task, body.results[task]);
    if (problem) return bad(problem);
  }
  const diff = body.results.motion_minus_form;
  if (diff !== null && !(isObj(diff) && isNum(diff.sensitivity))) return bad("results.motion_minus_form must be null or have a sensitivity");

  if (!Array.isArray(body.trials)) return bad("trials must be an array");
  if (body.trials.length > MAX_TRIALS) return bad("too many trials");

  return { ok: true, session: body as unknown as SessionExportV1 };
}
