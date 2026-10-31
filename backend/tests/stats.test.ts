import { describe, expect, it } from "vitest";
import { MIN_GROUP, parseGroups } from "../../src/app/comparison";
import { groupsResponse, groupStats, quantile, quantiles, type GroupValues } from "../src/stats";

const oneToTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** n values of a group, spread so the percentiles are in order. */
const values = (n: number): GroupValues => ({
  motion: Array.from({ length: n }, (_, i) => 5 + i * 0.5),
  form: Array.from({ length: n }, (_, i) => 10 + i),
  diff: Array.from({ length: n }, (_, i) => -0.02 + i * 0.004),
});

describe("quantile", () => {
  it("interpolates between order statistics", () => {
    expect(quantile(oneToTen, 0.5)).toBeCloseTo(5.5, 10);
    expect(quantile(oneToTen, 0.1)).toBeCloseTo(1.9, 10);
    expect(quantile(oneToTen, 0.9)).toBeCloseTo(9.1, 10);
    expect(quantile(oneToTen, 0)).toBe(1);
    expect(quantile(oneToTen, 1)).toBe(10);
  });

  it("returns the only value of a single value", () => {
    expect(quantile([7.5], 0.1)).toBe(7.5);
    expect(quantile([7.5], 0.9)).toBe(7.5);
  });

  it("doesn't need sorted input, and doesn't reorder it", () => {
    const input = [9, 1, 7, 3, 5, 10, 2, 8, 4, 6];
    expect(quantile(input, 0.5)).toBeCloseTo(5.5, 10);
    expect(input).toEqual([9, 1, 7, 3, 5, 10, 2, 8, 4, 6]);
  });

  it("throws on nothing", () => expect(() => quantile([], 0.5)).toThrow());
});

describe("quantiles", () => {
  it("returns the five percentiles in order", () => {
    const q = quantiles(oneToTen);
    expect(q.p10).toBeCloseTo(1.9, 10);
    expect(q.p25).toBeCloseTo(3.25, 10);
    expect(q.p50).toBeCloseTo(5.5, 10);
    expect(q.p75).toBeCloseTo(7.75, 10);
    expect(q.p90).toBeCloseTo(9.1, 10);
  });
});

describe("groupStats", () => {
  it("has no measures for an undefined group", () => expect(groupStats(undefined)).toEqual({ n: 0, measures: null }));
  it(`has no measures at ${MIN_GROUP - 1} values`, () => expect(groupStats(values(MIN_GROUP - 1))).toEqual({ n: MIN_GROUP - 1, measures: null }));
  it(`has all three measures at ${MIN_GROUP} values`, () => {
    const g = groupStats(values(MIN_GROUP));
    expect(g.n).toBe(MIN_GROUP);
    expect(Object.keys(g.measures!).sort()).toEqual(["form_threshold_pct", "motion_minus_form", "motion_threshold_pct"]);
    // Motion is 5, 5.5, ... 19.5: the median of 30 values is the mean of the 15th and 16th.
    expect(g.measures!.motion_threshold_pct.p50).toBeCloseTo(12.25, 10);
    expect(g.measures!.form_threshold_pct.p50).toBeCloseTo(24.5, 10);
  });
});

describe("groupsResponse", () => {
  it("gives both groups n 0 and no measures for a missing document", () => {
    expect(groupsResponse(1, undefined)).toEqual({
      test_version: 1,
      groups: { control: { n: 0, measures: null }, psychedelics: { n: 0, measures: null } },
    });
  });

  it("passes the page's own parseGroups, with one group shown and one too small", () => {
    const r = groupsResponse(2, { control: values(45), psychedelics: values(12) });
    const parsed = parseGroups(JSON.parse(JSON.stringify(r)));
    expect(parsed).not.toBeNull();
    expect(parsed!.test_version).toBe(2);
    expect(parsed!.groups.control.n).toBe(45);
    expect(parsed!.groups.control.measures).not.toBeNull();
    expect(parsed!.groups.psychedelics).toEqual({ n: 12, measures: null });
  });

  it("passes parseGroups for an empty response", () => expect(parseGroups(groupsResponse(1, undefined))).not.toBeNull());
});
