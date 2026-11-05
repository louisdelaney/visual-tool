// The header on every page: the links to the other pages and the steps of the test. Its
// paragraphs are in site.md.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is.
// Two things the header shows are written elsewhere, because other places show them too: the
// test's name is in ../languages.ts, and "Results by pseudonym", "Before you start" and "Viewing
// distance" are in labels.ts.

export const site = {
  // The links along the top. `label` names them for screen readers.
  nav: {
    label: "Pages",
    home: "Home",
    privacy: "Privacy and risks",
    references: "Method and references",
    data: "Data",
  },
  // The steps of the test, in four stages. `label` names them for screen readers.
  stepper: {
    label: "Progress",
    contribute: "Contribute",
    questions: "Questions",
    setup: "Set up",
    calibration: "Calibration",
    screen: "Screen size",
    tasks: "Tasks",
    results: "Results",
  },
};
