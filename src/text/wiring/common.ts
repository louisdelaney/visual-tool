// Words used on more than one page, and how the language writes numbers.
import { fill } from "../markdown";
import type { Words } from "../words";

export const common = (w: Words) => ({
  ...w.common,
  /** A number as a percentage, the way the language writes one: "12.5%" in English. */
  percent: (value: string | number) => fill(w.common.percent, { value }),
});
