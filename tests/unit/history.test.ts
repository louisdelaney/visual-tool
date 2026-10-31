// Pseudonyms and the /history response: matching ignores case and spacing, generated pseudonyms
// are two plain words, and untrusted responses are checked before they're shown.
import assert from "node:assert/strict";
import { test } from "vitest";
import { normalizePseudonym, parseHistory, sampleHistory, suggestPseudonym } from "../../src/app/history";
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
    { pseudonym: "x", sessions: [{ ...ok, values: { ...ok.values, motion_threshold_pct: "10" } }] },
    { pseudonym: "x", sessions: [{ ...ok, notes: 3 }] },
  ]) assert.equal(parseHistory(bad), null, JSON.stringify(bad));
});
