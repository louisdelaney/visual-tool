// Pseudonyms and the /history response: matching ignores case and spacing, generated pseudonyms
// are two plain words, and untrusted responses are checked before they're shown.
import assert from "node:assert/strict";
import { test } from "vitest";
import { normalizePseudonym, parseHistory, parseRawHistory, sampleHistory, suggestPseudonym } from "../../src/app/history";
import { ADJECTIVES, NOUNS } from "../../src/app/words";
import { mulberry32 } from "../../src/core";

test("pseudonyms: case and spacing don't matter", () => {
  assert.equal(normalizePseudonym("  Quiet   Heron "), "quiet heron");
  assert.equal(normalizePseudonym("quiet-heron"), "quiet-heron");
  assert.equal(normalizePseudonym("   "), "");
});

test("pseudonyms: generated ones are two dictionary words", () => {
  const rng = mulberry32(3);
  for (let i = 0; i < 200; i++) {
    const p = suggestPseudonym(rng);
    const [a, b, ...rest] = p.split("-");
    assert.equal(rest.length, 0, p);
    assert.ok(ADJECTIVES.includes(a!) && NOUNS.includes(b!), p);
    assert.equal(normalizePseudonym(p), p, "generated pseudonyms are already in stored form");
  }
  assert.equal(new Set(ADJECTIVES).size, ADJECTIVES.length, "no repeated adjectives");
  assert.equal(new Set(NOUNS).size, NOUNS.length, "no repeated nouns");
  assert.ok(ADJECTIVES.length * NOUNS.length > 30000, "enough pairs that people rarely land on the same one");
  assert.ok([...ADJECTIVES, ...NOUNS].every(w => /^[a-z]+$/.test(w)), "plain lower-case words only");
});

test("history: a valid response parses and is sorted oldest first", () => {
  const h = sampleHistory("quiet-heron");
  const shuffled = { ...h, sessions: [...h.sessions].reverse() };
  const parsed = parseHistory(shuffled);
  assert.ok(parsed);
  assert.deepEqual(parsed.sessions.map(s => s.submission_id), h.sessions.map(s => s.submission_id));
  assert.deepEqual(parseHistory({ pseudonym: "nobody", sessions: [] }), { pseudonym: "nobody", sessions: [] });
});

test("history: malformed responses are rejected", () => {
  const ok = sampleHistory("x").sessions[0]!;
  for (const bad of [
    null, [], { pseudonym: "x" }, { sessions: [] },
    { pseudonym: "x", sessions: [{ ...ok, started_at: "not a date" }] },
    { pseudonym: "x", sessions: [{ ...ok, test_version: "1" }] },
    { pseudonym: "x", sessions: [{ ...ok, test_type: "short" }] },
    { pseudonym: "x", sessions: [{ ...ok, values: { ...ok.values, motion_threshold_pct: "10" } }] },
    { pseudonym: "x", sessions: [{ ...ok, notes: 3 }] },
    { pseudonym: "x", sessions: [{ ...ok, staircases: { motion: [] } }] },
    { pseudonym: "x", sessions: [{ ...ok, staircases: { motion: [{ coherence_pct: "20", correct: true, reversal: false }], form: [] } }] },
    { pseudonym: "x", sessions: [{ ...ok, staircases: { motion: Array(301).fill({ coherence_pct: 20, correct: true, reversal: false }), form: [] } }] },
  ]) assert.equal(parseHistory(bad), null, JSON.stringify(bad));
});

test("history: entries from a backend before the quick test are the full test", () => {
  const { test_type: _, ...old } = sampleHistory("x").sessions[0]!;
  assert.equal(parseHistory({ pseudonym: "x", sessions: [old] })!.sessions[0]!.test_type, "full");
  assert.ok(sampleHistory("x").sessions.some(s => s.test_type === "quick"), "the sample shows a quick session");
});

test("history: staircases are optional, so an older backend's entries still parse", () => {
  const { staircases: _, ...old } = sampleHistory("x").sessions[0]!;
  assert.equal(parseHistory({ pseudonym: "x", sessions: [old] })!.sessions[0]!.staircases, null);
  assert.equal(parseHistory({ pseudonym: "x", sessions: [{ ...old, staircases: null }] })!.sessions[0]!.staircases, null);
});

test("history: previous answers parse, and bad or missing ones only leave the form to fill in by hand", () => {
  const ok = sampleHistory("x").sessions[0]!;
  const answers = {
    perceptual_disorder: "yes", condition: "vss", other_condition: null, diagnosed: "no", psychedelics: "yes", psychedelic_uses: 3,
    psychedelics_used: ["LSD"], takes_medication: "no", found_via: "reddit", found_via_other: null,
  };
  assert.deepEqual(parseHistory({ pseudonym: "x", sessions: [{ ...ok, answers }] })!.sessions[0]!.answers, answers);
  const { answers: _, ...old } = ok;
  assert.equal(parseHistory({ pseudonym: "x", sessions: [old] })!.sessions[0]!.answers, null, "an older backend sends none");
  for (const bad of [{ ...answers, condition: "flu" }, { ...answers, psychedelic_uses: 2.5 }, { ...answers, psychedelics_used: [1] }, "yes"]) {
    const parsed = parseHistory({ pseudonym: "x", sessions: [{ ...ok, answers: bad }] });
    assert.ok(parsed, "the history still shows");
    assert.equal(parsed.sessions[0]!.answers, null, JSON.stringify(bad));
  }
});

test("history: run info is kept when valid, and dropped (not the whole entry) when not", () => {
  const entry = sampleHistory("x").sessions[0]!;
  assert.deepEqual(parseHistory({ pseudonym: "x", sessions: [entry] })!.sessions[0]!.run, entry.run);
  for (const run of [{ ...entry.run, device: "phone" }, { ...entry.run, checks_missed: -1 }, { ...entry.run, status: { motion: "done", form: null } }, "x"]) {
    const parsed = parseHistory({ pseudonym: "x", sessions: [{ ...entry, run }] });
    assert.ok(parsed, JSON.stringify(run));
    assert.equal(parsed.sessions[0]!.run, null, JSON.stringify(run));
  }
  const { run: _, ...old } = entry;
  assert.equal(parseHistory({ pseudonym: "x", sessions: [old] })!.sessions[0]!.run, null, "an older backend sends none");
});

test("raw history: needs each session's id, start and trials", () => {
  const ok = { submission_id: "a", started_at: "2026-10-18T19:00:00.000Z", trials: [] };
  assert.ok(parseRawHistory({ pseudonym: "x", sessions: [ok] }));
  assert.equal(parseRawHistory({ pseudonym: "x", sessions: [{ ...ok, trials: null }] }), null);
  assert.equal(parseRawHistory({ pseudonym: "x", sessions: [{ ...ok, submission_id: 1 }] }), null);
  assert.equal(parseRawHistory({ sessions: [] }), null);
});
