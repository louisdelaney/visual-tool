// The Results by pseudonym page, and the line about how a run was taken that both results pages
// and the PDF show. Its notes are in history.md, and the words it shares with the Results page and
// the PDF are in labels.ts.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {pseudonym}, {count} and the like are
// filled in by the page: keep them, and move them anywhere in the sentence. Where a sentence
// changes with a number, there's one entry for one and another for more than one.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).

export const history = {
  // ---- Looking up a pseudonym ----
  pseudonymLabel: "Pseudonym",
  showResults: "Show results",
  lookingUp: "Looking up {pseudonym}…",
  loadFailed: "Couldn't load results for {pseudonym}. Check your connection and try again.",
  noResults: 'No results for "{pseudonym}". Pseudonyms ignore capitals and extra spaces, but otherwise must match exactly.',

  // ---- Every session ----
  // The save menu for all of them: its name for screen readers, its button, then each choice and
  // the line under it.
  saveAllLabel: "Save every session",
  saveAllButton: "Save all",
  saveAllPdf: "Save summaries (PDF)",
  saveAllPdfDescription: "Every session for {pseudonym}, with its charts, in one file to read or print.",
  saveAllSummaries: "Save summaries (JSON)",
  saveAllSummariesDescription: "Every session for {pseudonym}: answers, results and staircase points, in one file.",
  saveAllRawDescription: "Every session for {pseudonym} in full, as stored in the database, in one file.",
  sessionsHeadingOne: "{pseudonym}: {count} session, newest first",
  sessionsHeadingMany: "{pseudonym}: {count} sessions, newest first",
  // Shown by the save menus when saving fails.
  fetchFailed: "Couldn't get the data. Check your connection and try again.",
  sessionMissing: "Couldn't find that session's data. It may have been removed.",

  // ---- One session ----
  selectTitle: "Select for a PDF of chosen sessions",
  selectLabel: "Select this session for a PDF of chosen sessions",
  saveOneLabel: "Save this session",
  // Under each choice in a session's save menu.
  savePdfDescription: "Its results, charts and the groups as they are now, to read or print.",
  saveSummaryDescription: "Its answers, results and the points on the staircase charts.",
  saveFullDescription: "Everything recorded, exactly as it's stored in the database.",

  // ---- The bar pinned to the bottom while sessions are selected ----
  selectionLabel: "Selected sessions",
  // <strong> marks the number.
  selectedOne: "<strong>{count}</strong> session selected",
  selectedMany: "<strong>{count}</strong> sessions selected",
  clear: "Clear",
  saveAsPdf: "Save as PDF",

  // ---- How a run was taken: "Computer · 55 cm away · full screen" ----
  run: {
    device: { computer: "Computer", tablet: "Tablet" },
    distance: "{cm} cm away",
    fullScreen: "full screen",
    notFullScreen: "not full screen",
  },
};
