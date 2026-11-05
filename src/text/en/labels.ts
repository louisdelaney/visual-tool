// Short words that appear in more than one place: on both results pages, in the PDF and in the
// header. Each is written once here, and the files for those places read it from here
// (charts.ts, results.ts, history.ts, pdf.ts, site.ts, setup.ts), so they never drift apart.
//
// This file is only words. Every entry is plain text in quotes: change the words between the
// quotes, and leave the name before the colon as it is. {n}, {value} and the like are filled in by
// the page: keep them, and move them anywhere in the sentence.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).

export const labels = {
  // ---- Names of pages and steps ----
  resultsByPseudonym: "Results by pseudonym",
  beforeYouStart: "Before you start",
  viewingDistance: "Viewing distance",

  // ---- The two tasks and the three numbers ----
  motion: "Motion",
  form: "Form",
  motionMinusForm: "Motion − form",
  motionThreshold: "Motion threshold",
  formThreshold: "Form threshold",
  motionMinusFormSensitivity: "Motion minus form sensitivity",
  sensitivity: "Sensitivity",
  threshold: "Threshold",

  // ---- Under each number ----
  sensitivityLine: "sensitivity {value}",
  scoredTrials: "{n} scored trials",
  thresholdRatio: "motion ÷ form threshold {value}",
  notRun: "Not run",
  endedEarly: "Ended early",
  noThreshold: "No threshold",
  needsBoth: "Needs both thresholds",

  // ---- How the run was taken, and what the person wrote ----
  takenOn: "Taken on: {how}",
  medications: "Medications",
  notes: "Notes",

  // ---- Beside the groups ----
  groupsHeading: "Compared with other groups",
  thisRun: "This run",
  people: "{n} people",
  noValue: "This run didn't reach a value for this.",
  thisRunValue: "This run: {value}.",
  groupValue: "{group}: {numbers}.",

  // ---- Staircases ----
  staircasesHeading: "Staircases",
  staircaseSubtitle: "Coherence (%) on each scored trial, log scale",
  noStaircases: "No staircases were kept for this session.",
  noTrials: "No trials were completed.",
  trial: "Trial",
  keyCorrect: "Correct",
  keyWrong: "Wrong",
  keyReversal: "Reversal",
  keyThreshold: "Threshold, averaged from the last reversals",

  numbersHeading: "What the numbers mean",

  // ---- Saving ----
  savePdf: "Save summary (PDF)",
  saveSummary: "Save summary (JSON)",
  saveFull: "Save full data (JSON)",
  makingPdf: "Making the PDF…",
  saved: "Saved {file}.",
  couldntSave: "Couldn't save it.",

  // ---- Development only: never in a build ----
  sampleHistory: "Sample data for development. This isn't anyone's real history.",
  sampleGroups: "Sample data for development. These are not real groups.",
};
