// The header on every page: the links to the other pages, the title, the "just for fun" notice and
// the steps of the test.
import type { Md } from "../markdown";
import type { Words } from "../words";

export const site = (w: Words, md: Md, name: string) => ({
  nav: { ...w.site.nav, history: w.labels.resultsByPseudonym },
  /** The test's name, from languages.ts. */
  title: name,
  lede: md("lede"),
  funNotice: md("funNotice"),
  /** The steps of the test, in four stages. */
  stepper: { ...w.site.stepper, beforeYouStart: w.labels.beforeYouStart, distance: w.labels.viewingDistance },
});
