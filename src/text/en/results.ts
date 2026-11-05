// The Results page: the notice about sending, the save card and the Session details. Its notes are
// in results.md, and the words it shares with the PDF and the Results by pseudonym page are in
// labels.ts.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {id}, {cm} and the like are filled in by
// the page: keep them, and move them anywhere in the sentence.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).

export const results = {
  // ---- The notice in the header, carrying on from "just for fun" ----
  // Names the part about sending, for screen readers.
  sendingLabel: "Sending your results",
  sending: "Sending your results…",
  sendFailed: "Couldn't send your results. Check your connection and try again.",
  failureReference: "Reference: {id}. You can quote it if you report a problem.",
  trySendingAgain: "Try sending again",

  // Taking a sent session back out of the database.
  removeStart: "Remove from the database",
  removeQuestion: "Remove this session from the database? This can't be undone.",
  removeIt: "Remove it",
  removing: "Removing…",
  keepIt: "Keep it",
  // When removing fails: without a reference to quote, and with one.
  removeFailed: "Couldn't remove it. Check your connection and try again.",
  removeFailedReference: "Couldn't remove it. Check your connection and try again. Reference: {reference}.",

  // ---- The save card ----
  heading: "Results",
  // Under each choice in the save menu.
  savePdfDescription: "These results, charts and the groups as they are now, to read or print.",
  saveSummaryDescription: "Your pseudonym, answers, results and the points on the staircase charts.",
  // The full data: when the results were sent, and when they weren't.
  saveFullDescriptionSent: "Everything recorded, exactly as it's sent to the database.",
  saveFullDescriptionNotSent: "Everything recorded, exactly as it would be sent to the database.",
  // Shown by the save menu when the PDF can't be made.
  pdfFailed: "Couldn't make the PDF. Try again, or reload the page.",
  // Read by screen readers before the pseudonym.
  seeAllFor: "See all results for",
  yourPseudonym: "Your pseudonym:",
  leaveForHistory: "Leave this page to see all your results? Back brings you here again, but if the page is reloaded or closed, these results are gone unless you've saved them.",

  // ---- Session details: a label and a value on each row ----
  sessionHeading: "Session",
  rows: {
    testVersion: "Test version",
    test: "Test",
    // {testType} is "Full test" or "Quick test".
    testValue: "{testType}: each task stops at {stopReversals} reversals, threshold from the last {meanOfLast}",
    started: "Started",
    screenScale: "Screen scale",
    screenScaleValue: "{pxPerMm} px per mm, card {cardPx} px wide",
    // {how} is one of the next two.
    viewingDistanceValue: "{cm} cm, {how}",
    distanceByHand: "entered by hand",
    distanceBlindSpot: "blind spot, {readings} readings {lo}–{hi} cm",
    pixelsPerDegree: "Pixels per degree",
    pixelsPerDegreeRange: "{lo}–{hi}",
    // When the stimuli were drawn at full size, and when they were shrunk to fit.
    pixelsPerDegreeFull: "{ppd}, stimuli at full protocol size",
    pixelsPerDegreeShrunk: "{ppd}, stimuli shrunk to {pct}% of protocol size to fit",
    window: "Window",
    fullScreen: "Full screen",
    notFullScreen: "Not full screen, {widthPct}% of the screen's width",
    displayRefresh: "Display refresh",
    displayRefreshValue: "{hz} Hz, median frame {frameMs} ms",
    droppedFrames: "Dropped frames",
    // {task} is one of these two.
    droppedTask: { motion: "motion", form: "form flashes" },
    droppedValue: "{task} {dropped} of {frames} ({pct}%)",
    easyChecks: "Easy check trials correct",
    // {task} is one of these two.
    easyCheckTask: { motion: "motion", form: "form" },
    easyChecksValue: "{task} {correct} of {total}",
    motionDisplay: "Motion display",
    motionDisplayValue: "{ms} ms flash",
    flashLength: "Flash length",
    flashLengthValue: "median {median} ms, range {lo}–{hi} ms (target 200 ms)",
    ended: "Ended",
    endedEarly: "Early, at your request",
    browser: "Browser",
  },
};
