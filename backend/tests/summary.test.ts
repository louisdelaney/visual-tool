import { describe, expect, it } from "vitest";
import { groupOf, historyEntry, measuresOf, staircasesOf, summaryRow, type SummaryRow } from "../src/summary";
import { makeSession } from "./fixture";

describe("summaryRow", () => {
  it("normalises the pseudonym", () => {
    const row = summaryRow(makeSession({ answers: { pseudonym: "  Quiet  Heron " } }), "id-1");
    expect(row.pseudonym).toBe("quiet heron");
  });

  it("stores an empty or blank pseudonym as null", () => {
    expect(summaryRow(makeSession({ answers: { pseudonym: "" } }), "id").pseudonym).toBeNull();
    expect(summaryRow(makeSession({ answers: { pseudonym: "   " } }), "id").pseudonym).toBeNull();
    expect(summaryRow(makeSession({ answers: { pseudonym: null } }), "id").pseudonym).toBeNull();
  });

  it("copies the id, start, version, every answer, the measures, the staircases and the run info", () => {
    const s = makeSession({ answers: { medications: ["Lamotrigine"], notes: "Tired today.", psychedelics: "yes" } });
    expect(summaryRow(s, "abc")).toEqual({
      submission_id: "abc",
      pseudonym: "quiet heron",
      started_at: s.started_at,
      test_version: s.test_version,
      test_type: "full",
      disorder: "no",
      condition: null,
      other_condition: null,
      diagnosed: null,
      psychedelics: "yes",
      psychedelic_uses: null,
      psychedelics_used: null,
      takes_medication: "no",
      values: { motion_threshold_pct: 10.2, form_threshold_pct: 21.0, motion_minus_form: 0.05 },
      medications: ["Lamotrigine"],
      notes: "Tired today.",
      found_via: "forum",
      found_via_other: null,
      staircases: staircasesOf(s),
      run: { status: { motion: "complete", form: "complete" }, checks_missed: 0, device: "computer", distance_cm: 62, fullscreen: true },
    });
  });

  it("counts missed easy checks, unfinished tasks and a tablet", () => {
    const base = makeSession();
    const s = makeSession({
      results: { motion: { ...base.results!.motion!, catch_correct: 8 }, form: { ...base.results!.form!, status: "incomplete", catch_correct: 9 } },
      environment: { ...base.environment, device: "tablet" }, display: { ...base.display, fullscreen: false }, viewing_distance: null,
    });
    expect(summaryRow(s, "id").run).toEqual({ status: { motion: "complete", form: "incomplete" }, checks_missed: 3, device: "tablet", distance_cm: null, fullscreen: false });
  });

  it("reads a session from before the device type as a computer", () => {
    const s = makeSession();
    delete (s.environment as Partial<typeof s.environment>).device;
    expect(summaryRow(s, "id").run?.device).toBe("computer");
  });
});

describe("measuresOf", () => {
  it("is null for a task that wasn't reached", () => {
    const m = measuresOf(makeSession({ results: { form: null, motion_minus_form: null } }));
    expect(m).toEqual({ motion_threshold_pct: 10.2, form_threshold_pct: null, motion_minus_form: null });
  });
});

describe("groupOf", () => {
  const incomplete = { ...makeSession().results!.form!, status: "incomplete" as const };

  it("puts psychedelics 'no' in control", () => expect(groupOf(makeSession())).toBe("control"));
  it("puts psychedelics 'yes' in psychedelics", () => expect(groupOf(makeSession({ answers: { psychedelics: "yes" } }))).toBe("psychedelics"));
  it("leaves out prefer-not-to-say", () => expect(groupOf(makeSession({ answers: { psychedelics: "prefer-not-to-say" } }))).toBeNull());
  it("leaves out an unanswered psychedelics question", () => expect(groupOf(makeSession({ answers: { psychedelics: null } }))).toBeNull());
  it("leaves out anyone reporting a disorder", () => expect(groupOf(makeSession({ answers: { perceptual_disorder: "yes" } }))).toBeNull());
  it("leaves out an unanswered disorder question", () => expect(groupOf(makeSession({ answers: { perceptual_disorder: null } }))).toBeNull());
  it("leaves out an incomplete task", () => expect(groupOf(makeSession({ results: { form: incomplete } }))).toBeNull());
  it("leaves out a task that wasn't reached", () => expect(groupOf(makeSession({ results: { motion: null } }))).toBeNull());
  it("leaves out a session with a null measure", () => {
    expect(groupOf(makeSession({ results: { motion_minus_form: null } }))).toBeNull();
    const noThreshold = { ...makeSession().results!.motion!, threshold_pct: null };
    expect(groupOf(makeSession({ results: { motion: noThreshold } }))).toBeNull();
  });
  it("leaves out a session that wasn't contributed", () => expect(groupOf(makeSession({ contribution: { contribute: false } }))).toBeNull());
});

describe("historyEntry", () => {
  it("drops the pseudonym and keeps the answers, so the questions page can fill them in again", () => {
    const row = summaryRow(makeSession({ answers: { notes: "hello" } }), "abc");
    const entry = historyEntry(row);
    expect(Object.keys(entry).sort()).toEqual(["answers", "medications", "notes", "run", "staircases", "started_at", "submission_id", "test_type", "test_version", "values"]);
    expect(entry).not.toHaveProperty("pseudonym");
    expect(entry.notes).toBe("hello");
    expect(entry.answers).toEqual({
      perceptual_disorder: row.disorder, condition: row.condition, other_condition: row.other_condition, diagnosed: row.diagnosed,
      psychedelics: row.psychedelics, psychedelic_uses: row.psychedelic_uses, psychedelics_used: row.psychedelics_used,
      takes_medication: row.takes_medication, found_via: row.found_via, found_via_other: row.found_via_other,
    });
  });
  it("fills answers missing from an older row with null", () => {
    const { found_via: _, found_via_other: __, ...old } = summaryRow(makeSession(), "abc");
    expect(historyEntry(old as SummaryRow).answers).toMatchObject({ found_via: null, found_via_other: null });
  });
  it("sends an older row's exact time to the hour only", () => {
    const old = { ...summaryRow(makeSession(), "abc"), started_at: "2026-10-18T19:31:07.000Z" };
    expect(historyEntry(old).started_at).toBe("2026-10-18T19:00:00.000Z");
  });
});

describe("staircasesOf", () => {
  it("keeps each task's scored trials, in order", () => {
    const s = makeSession();
    const st = staircasesOf(s);
    const scored = (task: string) => s.trials.filter(t => t.task === task && t.phase === "test");
    expect(st.motion).toHaveLength(scored("motion").length);
    expect(st.form).toHaveLength(scored("form").length);
    expect(st.motion[0]).toEqual({ coherence_pct: Math.round(scored("motion")[0]!.effective_level_pct * 100) / 100, correct: scored("motion")[0]!.correct, reversal: scored("motion")[0]!.reversal });
    expect(summaryRow(s, "id").staircases).toEqual(st);
  });
});
