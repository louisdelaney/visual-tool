// The header on every page: the links to the other pages, the title, the "just for fun" notice and
// the steps of the test. The paragraphs are in site.md.
import source from "./site.md";
import { markdown } from "../markdown";

const md = markdown(source, "site.md");

export const site = {
  nav: {
    label: "Pages",
    home: "Home",
    history: "Results by pseudonym",
    privacy: "Privacy and risks",
    references: "Method and references",
    data: "Data",
  },
  title: "Form–Motion Coherence Test",
  lede: md("lede"),
  funNotice: md("funNotice"),
  /** The steps of the test, in four stages. */
  stepper: {
    label: "Progress",
    beforeYouStart: "Before you start",
    contribute: "Contribute",
    questions: "Questions",
    setup: "Set up",
    calibration: "Calibration",
    screen: "Screen size",
    distance: "Viewing distance",
    tasks: "Tasks",
    results: "Results",
  },
};
