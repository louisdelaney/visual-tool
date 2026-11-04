// The Results by pseudonym page, and the lines about how a run was taken that both results pages show.
// The notes are in history.md.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).
import source from "./history.md";
import { markdown } from "../markdown";

const md = markdown(source, "history.md");
const missedOneCheck = md("run.missedOneCheck");
const missedChecks = md.template("run.missedChecks");

export const history = {
  // ---- Looking up a pseudonym ----
  heading: "Results by pseudonym",
  intro: md("intro"),
  notAvailable: md("notAvailable"),
  pseudonymLabel: "Pseudonym",
  showResults: "Show results",
  lookingUp: (pseudonym: string) => `Looking up ${pseudonym}…`,
  loadFailed: (pseudonym: string) => `Couldn't load results for ${pseudonym}. Check your connection and try again.`,
  noResults: (pseudonym: string) => `No results for "${pseudonym}". Pseudonyms ignore capitals and extra spaces, but otherwise must match exactly.`,

  // ---- Every session ----
  saveAllLabel: "Save every session",
  saveAllButton: "Save all",
  saveAllPdf: { label: "Save summaries (PDF)", description: (pseudonym: string) => `Every session for ${pseudonym}, with its charts, in one file to read or print.` },
  saveAllSummaries: { label: "Save summaries (JSON)", description: (pseudonym: string) => `Every session for ${pseudonym}: answers, results and staircase points, in one file.` },
  saveAllRaw: { label: "Save full data (JSON)", description: (pseudonym: string) => `Every session for ${pseudonym} in full, as stored in the database, in one file.` },
  /** Development only. */
  sampleBanner: "Sample data for development. This isn't anyone's real history.",
  sessionsHeading: (pseudonym: string, count: number) => `${pseudonym}: ${count} ${count === 1 ? "session" : "sessions"}, newest first`,
  justForFun: md("justForFun"),
  practice: md("practice"),
  staircasesHint: md("staircasesHint"),
  selectHint: md("selectHint"),
  // Shown by the save menus when saving fails.
  fetchFailed: "Couldn't get the data. Check your connection and try again.",
  sessionMissing: "Couldn't find that session's data. It may have been removed.",

  // ---- One session ----
  selectTitle: "Select for a PDF of chosen sessions",
  selectLabel: "Select this session for a PDF of chosen sessions",
  saveOneLabel: "Save this session",
  savePdf: { label: "Save summary (PDF)", description: "Its results, charts and the groups as they are now, to read or print." },
  saveSummary: { label: "Save summary (JSON)", description: "Its answers, results and the points on the staircase charts." },
  saveFull: { label: "Save full data (JSON)", description: "Everything recorded, exactly as it's stored in the database." },
  makingPdf: "Making the PDF…",
  quickNote: md("quickNote"),
  earlierVersion: md("earlierVersion"),
  groupsHeading: "Compared with other groups",
  staircaseSubtitle: "Coherence (%) on each scored trial, log scale",
  noStaircases: "No staircases were kept for this session.",

  // ---- The bar pinned to the bottom while sessions are selected ----
  selectionLabel: "Selected sessions",
  /** The count is a number; <strong> marks it. */
  selectedCount: (count: number) => `<strong>${count}</strong> ${count === 1 ? "session" : "sessions"} selected`,
  clear: "Clear",
  saveAsPdf: "Save as PDF",
  saved: (filename: string) => `Saved ${filename}.`,
  couldntSave: "Couldn't save it.",

  // ---- How a run was taken, on both results pages and in the PDF (plain text, no tags) ----
  run: {
    device: { computer: "Computer", tablet: "Tablet" },
    distance: (cm: string) => `${cm} cm away`,
    fullScreen: "full screen",
    notFullScreen: "not full screen",
    /** Between the parts of "Computer · 55 cm away · full screen". */
    separator: " · ",
    missedChecks: (missed: number) => (missed === 1 ? missedOneCheck : missedChecks({ missed })),
  },
};
