import { describe, expect, it } from "vitest";
import { TEST_VERSION } from "../../src/core/protocol";
import { validateSession } from "../src/validate";
import { asSchemaV1, makeQuickSession, makeSession } from "./fixture";

function rejects(body: unknown, reason?: RegExp) {
  const v = validateSession(body);
  expect(v.ok).toBe(false);
  if (!v.ok && reason) expect(v.reason).toMatch(reason);
}

describe("validateSession", () => {
  it("accepts a complete session", () => {
    const s = makeSession();
    const v = validateSession(s);
    expect(v.ok).toBe(true);
  });

  it("rejects bodies that aren't objects", () => {
    for (const body of [null, undefined, "text", 42, [], [makeSession()]]) rejects(body, /object/);
  });

  it("checks the schema name and version", () => {
    rejects({ ...makeSession(), schema: "something/else" }, /schema/);
    rejects({ ...makeSession(), schema_version: 3 }, /schema_version/);
    rejects({ ...makeSession(), schema_version: undefined }, /schema_version/);
  });

  describe("test type", () => {
    it("accepts a quick session", () => expect(validateSession(makeQuickSession()).ok).toBe(true));
    it("accepts schema 1, from a page opened before the quick test, as the full test", () => expect(validateSession(asSchemaV1(makeSession())).ok).toBe(true));
    it("needs a known test type from schema 2", () => {
      rejects({ ...makeSession(), test_type: undefined }, /test_type/);
      rejects({ ...makeSession(), test_type: "short" }, /test_type/);
    });
    it("refuses a test type on schema 1", () => rejects({ ...asSchemaV1(makeQuickSession()), test_type: "quick" }, /test_type/));
    it("holds each test type's complete tasks to its own run length", () => {
      const results = (trials: number) => ({ motion: { ...makeSession().results!.motion!, staircase_trials: trials } });
      expect(validateSession(makeQuickSession({ results: results(8) })).ok).toBe(true);
      rejects(makeQuickSession({ results: results(7) }), /too few trials/);
      rejects(makeSession({ results: results(8) }), /too few trials/);
    });
  });

  it("needs the current test_version", () => {
    rejects(makeSession({ test_version: 0 }), /test_version/);
    rejects(makeSession({ test_version: 1.5 }), /test_version/);
    rejects(makeSession({ test_version: TEST_VERSION + 1 }), /test_version/);
    rejects(makeSession({ test_version: String(TEST_VERSION) as unknown as number }), /test_version/);
  });

  describe("run length", () => {
    it("rejects a run of 20 seconds", () => rejects(makeSession({ duration_s: 20 }), /duration/));
    it("rejects a run of 3 hours", () => rejects(makeSession({ duration_s: 3 * 3600 }), /duration/));
    it("accepts a session that hasn't finished", () => expect(validateSession(makeSession({ duration_s: null })).ok).toBe(true));
    it("rejects a negative duration", () => rejects(makeSession({ duration_s: -60 }), /duration/));
    it("rejects a duration that isn't a number", () => rejects(makeSession({ duration_s: "9 minutes" as unknown as number }), /duration_s/));
    it("rejects dates that aren't dates", () => {
      rejects(makeSession({ started_at: "yesterday-ish" }), /started_at/);
      const old = asSchemaV1(makeSession());
      rejects({ ...old, finished_at: "later" }, /finished_at/);
    });
    it("still checks a version 1 run's length from its exact times", () => {
      const old = asSchemaV1(makeSession());
      expect(validateSession(old).ok).toBe(true);
      rejects({ ...old, finished_at: new Date(Date.parse(old.started_at) + 20_000).toISOString() }, /duration/);
    });
  });

  describe("device", () => {
    it("accepts a computer or a tablet", () => {
      for (const device of ["computer", "tablet"] as const) expect(validateSession(makeSession({ environment: { ...makeSession().environment, device } })).ok).toBe(true);
    });
    it("rejects a phone, or no device", () => {
      rejects(makeSession({ environment: { ...makeSession().environment, device: "phone" } }), /device/);
      const { device: _, ...env } = makeSession().environment;
      rejects({ ...makeSession(), environment: env }, /device/);
    });
  });

  describe("contribution", () => {
    it("rejects a session that wasn't contributed", () => rejects(makeSession({ contribution: { contribute: false } }), /contributed/));
    it("rejects a missing contribution", () => rejects(makeSession({ contribution: null }), /contributed/));
    it("rejects 3,000 characters of notes", () => rejects(makeSession({ answers: { notes: "n".repeat(3000) } }), /notes/));
    it("accepts notes at the limit", () => expect(validateSession(makeSession({ answers: { notes: "n".repeat(2000) } })).ok).toBe(true));
    it("rejects a 61-character pseudonym", () => rejects(makeSession({ answers: { pseudonym: "p".repeat(61) } }), /pseudonym/));
    it("accepts a 60-character pseudonym", () => expect(validateSession(makeSession({ answers: { pseudonym: "p".repeat(60) } })).ok).toBe(true));
    it("accepts a missing pseudonym", () => expect(validateSession(makeSession({ answers: { pseudonym: null } })).ok).toBe(true));
    it('rejects perceptual_disorder "maybe"', () => rejects(makeSession({ answers: { perceptual_disorder: "maybe" as never } }), /perceptual_disorder/));
    it("rejects an unknown psychedelics answer", () => rejects(makeSession({ answers: { psychedelics: "sometimes" as never } }), /psychedelics/));
    it("accepts prefer-not-to-say", () => expect(validateSession(makeSession({ answers: { psychedelics: "prefer-not-to-say" } })).ok).toBe(true));
    it("accepts a list of medications", () => expect(validateSession(makeSession({ answers: { medications: ["Lamotrigine", "Melatonin"] } })).ok).toBe(true));
    it("rejects medications as one string", () => rejects(makeSession({ answers: { medications: "Lamotrigine" as never } }), /medications/));
    it("rejects an empty list", () => rejects(makeSession({ answers: { psychedelics_used: [] } }), /psychedelics_used/));
    it("rejects an empty entry", () => rejects(makeSession({ answers: { medications: [""] } }), /medications/));
    it("rejects a 101-character entry", () => rejects(makeSession({ answers: { psychedelics_used: ["p".repeat(101)] } }), /psychedelics_used/));
    it("rejects 21 entries", () => rejects(makeSession({ answers: { medications: Array.from({ length: 21 }, (_, i) => `m${i}`) } }), /medications/));
  });

  describe("results", () => {
    const task = (patch: object) => ({ ...makeSession().results!.motion!, ...patch });

    it("rejects threshold_pct 0 and 150", () => {
      rejects(makeSession({ results: { motion: task({ threshold_pct: 0 }) } }), /threshold_pct/);
      rejects(makeSession({ results: { form: task({ threshold_pct: 150 }) } }), /threshold_pct/);
    });
    it("accepts threshold_pct 100", () => expect(validateSession(makeSession({ results: { motion: task({ threshold_pct: 100 }) } })).ok).toBe(true));
    it("rejects a complete task with 3 staircase trials", () => rejects(makeSession({ results: { motion: task({ staircase_trials: 3 }) } }), /too few trials/));
    it("rejects a complete task with no threshold", () => rejects(makeSession({ results: { motion: task({ threshold_pct: null }) } }), /no threshold/));
    it("accepts an incomplete task with no threshold", () => {
      const incomplete = task({ status: "incomplete", threshold_pct: null, staircase_trials: 3 });
      expect(validateSession(makeSession({ results: { form: incomplete, motion_minus_form: null } })).ok).toBe(true);
    });
    it("rejects an unknown status", () => rejects(makeSession({ results: { motion: task({ status: "done" }) } }), /status/));
    it("accepts a task that was never reached (null)", () => expect(validateSession(makeSession({ results: { form: null, motion_minus_form: null } })).ok).toBe(true));
    it("rejects a difference without a sensitivity", () => rejects(makeSession({ results: { motion_minus_form: { threshold_ratio: 1 } as never } }), /motion_minus_form/));
  });

  describe("trials", () => {
    it("rejects 401 trials", () => rejects({ ...makeSession(), trials: makeSession().trials.concat(makeSession().trials, makeSession().trials, makeSession().trials).slice(0, 401) }, /too many/));
    it("accepts 400 trials", () => expect(validateSession({ ...makeSession(), trials: makeSession().trials.concat(makeSession().trials, makeSession().trials, makeSession().trials).slice(0, 400) }).ok).toBe(true));
    it("rejects trials that aren't an array", () => rejects({ ...makeSession(), trials: { length: 3 } }, /trials/));
  });

  it("passes unknown extra fields through unchanged", () => {
    const body = { ...makeSession(), future_field: { a: [1, 2, 3] } };
    const v = validateSession(body);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.session).toEqual(body);
  });
});
