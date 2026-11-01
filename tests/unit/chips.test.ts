// List answers typed one at a time: what's sent is the chips plus anything still typed, without repeats.
import assert from "node:assert/strict";
import { test } from "vitest";
import { chipValues, MAX_CHIPS, NO_CHIPS } from "../../src/components/ChipInput";

test("chips: nothing added sends null", () => {
  assert.equal(chipValues(NO_CHIPS), null);
  assert.equal(chipValues({ items: [], typing: "   " }), null);
});

test("chips: text typed but not added still counts, tidied", () => {
  assert.deepEqual(chipValues({ items: ["Lamotrigine"], typing: "  melatonin  tablets " }), ["Lamotrigine", "melatonin tablets"]);
});

test("chips: a repeat of an added entry isn't sent twice, whatever its case", () => {
  assert.deepEqual(chipValues({ items: ["Psilocybin"], typing: "psilocybin" }), ["Psilocybin"]);
});

test("chips: never more than the limit", () => {
  const items = Array.from({ length: MAX_CHIPS }, (_, i) => `m${i}`);
  assert.equal(chipValues({ items, typing: "one more" })!.length, MAX_CHIPS);
});
