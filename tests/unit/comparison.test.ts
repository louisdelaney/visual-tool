// The group comparison's handling of server data: untrusted responses must be checked before
// they're drawn, and a group too small to show stays hidden.
import assert from "node:assert/strict";
import { test } from "vitest";
import { groupSensitivities, MIN_GROUP, ownValues, parseGroups, SAMPLE_GROUPS, sensitivities, shownMeasures } from "../../src/app/comparison";
import type { Results } from "../../src/app/types";

const q = { p10: 5, p25: 8, p50: 10, p75: 13, p90: 18 };
const measures = { motion_threshold_pct: q, form_threshold_pct: q, motion_minus_form: { p10: -0.01, p25: 0.02, p50: 0.04, p75: 0.07, p90: 0.1 } };
const valid = { test_version: 1, groups: { control: { n: 40, measures }, psychedelics: { n: 12, measures: null } } };

test("groups: a well-formed response parses", () => {
  assert.deepEqual(parseGroups(valid), valid);
  assert.deepEqual(parseGroups(SAMPLE_GROUPS), SAMPLE_GROUPS);
});

test("groups: malformed responses are rejected", () => {
  for (const bad of [
    null, "nope", 42, {},
    { ...valid, test_version: "1" },
    { test_version: 1, groups: { control: valid.groups.control } },
    { ...valid, groups: { ...valid.groups, control: { n: -1, measures } } },
    { ...valid, groups: { ...valid.groups, control: { n: 40, measures: { ...measures, form_threshold_pct: undefined } } } },
    { ...valid, groups: { ...valid.groups, control: { n: 40, measures: { ...measures, motion_threshold_pct: { ...q, p50: Number.NaN } } } } },
    { ...valid, groups: { ...valid.groups, control: { n: 40, measures: { ...measures, motion_threshold_pct: { ...q, p25: 20 } } } } },
  ]) assert.equal(parseGroups(bad), null, JSON.stringify(bad));
});

test("groups: a group under the minimum isn't shown, even if the server sends measures", () => {
  assert.ok(MIN_GROUP >= 5, "the minimum keeps small groups hidden");
  assert.equal(shownMeasures({ n: MIN_GROUP - 1, measures }), null);
  assert.deepEqual(shownMeasures({ n: MIN_GROUP, measures }), measures);
  assert.equal(shownMeasures({ n: 100, measures: null }), null);
});

test("groups: own values come from the results, null where no threshold was reached", () => {
  const r: Results = {
    motion: { status: "complete", threshold_pct: 9.5, threshold_nominal_pct: 9.5, sensitivity: 0.105, reversals_pct: [], staircase_trials: 40, catch_correct: 5, catch_total: 5, all_trials: 49 },
    form: null,
    motion_minus_form: null,
  };
  assert.deepEqual(ownValues(r), { motion_threshold_pct: 9.5, form_threshold_pct: null, motion_minus_form: null });
});

test("sensitivity: 1 ÷ threshold, with a group's quartiles swapped by the reversal", () => {
  assert.deepEqual(sensitivities({ motion_threshold_pct: 5, form_threshold_pct: 20, motion_minus_form: 0.15 }), { motion: 0.2, form: 0.05, diff: 0.15 });
  assert.deepEqual(sensitivities({ motion_threshold_pct: null, form_threshold_pct: 20, motion_minus_form: null }), { motion: null, form: 0.05, diff: null });
  const g = groupSensitivities(measures);
  assert.deepEqual(g.motion, { p25: 1 / 13, p50: 1 / 10, p75: 1 / 8 });
  assert.deepEqual(g.diff, { p25: 0.02, p50: 0.04, p75: 0.07 });
});
