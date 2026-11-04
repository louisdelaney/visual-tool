// The Results page: the notice about sending, the save card, the staircases and the Session details.
// The notes are in results.md.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).
import source from "./results.md";
import { markdown } from "../markdown";

const md = markdown(source, "results.md");
const quickNote = md("quickNote");
const quickNoteSent = md("quickNoteSent");

export const results = {
  // ---- The notice in the header, carrying on from "just for fun" ----
  /** aria-label of the part about sending. */
  sendingLabel: "Sending your results",
  notSentNote: md("notSentNote"),
  anonymousNote: md("anonymousNote"),
  removed: md("removed"),
  sending: "Sending your results…",
  sendFailed: "Couldn't send your results. Check your connection and try again.",
  sendingNotSetUp: md("sendingNotSetUp"),
  failureReference: (id: string) => `Reference: ${id}. You can quote it if you report a problem.`,
  trySendingAgain: "Try sending again",

  // Taking a sent session back out of the database.
  removeOffer: md("removeOffer"),
  removeStart: "Remove from the database",
  removeQuestion: "Remove this session from the database? This can't be undone.",
  removeIt: "Remove it",
  removing: "Removing…",
  keepIt: "Keep it",
  removeFailed: (reference: string | undefined) => `Couldn't remove it. Check your connection and try again.${reference ? ` Reference: ${reference}.` : ""}`,

  // ---- The save card ----
  heading: "Results",
  savePdf: { label: "Save summary (PDF)", description: "These results, charts and the groups as they are now, to read or print.", pending: "Making the PDF…" },
  saveSummary: { label: "Save summary (JSON)", description: "Your pseudonym, answers, results and the points on the staircase charts." },
  saveFull: {
    label: "Save full data (JSON)",
    description: (contributing: boolean) => `Everything recorded, exactly as ${contributing ? "it's" : "it would be"} sent to the database.`,
  },
  /** Shown by the save menu when the PDF can't be made. */
  pdfFailed: "Couldn't make the PDF. Try again, or reload the page.",
  quickNote: (contributing: boolean) => (contributing ? quickNoteSent : quickNote),
  // Read by screen readers before the pseudonym; the trailing space matters.
  seeAllFor: "See all results for ",
  yourPseudonym: "Your pseudonym: ",
  savedUnderPseudonym: md("savedUnderPseudonym"),
  findAgainPseudonym: md("findAgainPseudonym"),
  leaveForHistory: "Leave this page to see all your results? Back brings you here again, but if the page is reloaded or closed, these results are gone unless you've saved them.",

  // ---- Staircases ----
  staircasesHeading: "Staircases",
  staircaseSubtitle: "Coherence (%) on each scored trial, log scale",
  noTrials: "No trials were completed.",

  // ---- Session details: a label and a value on each row ----
  sessionHeading: "Session",
  rows: {
    testVersion: "Test version",
    test: "Test",
    testValue: (testType: string, stopReversals: number, meanOfLast: number) => `${testType}: each task stops at ${stopReversals} reversals, threshold from the last ${meanOfLast}`,
    started: "Started",
    screenScale: "Screen scale",
    screenScaleValue: (pxPerMm: string, cardPx: string) => `${pxPerMm} px per mm, card ${cardPx} px wide`,
    viewingDistance: "Viewing distance",
    viewingDistanceValue: (cm: string, how: string) => `${cm} cm, ${how}`,
    distanceByHand: "entered by hand",
    distanceBlindSpot: (readings: number, lo: string, hi: string) => `blind spot, ${readings} readings ${lo}–${hi} cm`,
    pixelsPerDegree: "Pixels per degree",
    pixelsPerDegreeRange: (lo: string, hi: string) => `${lo}–${hi}`,
    /** `shrunkToPct` is null when the stimuli were drawn at full size. */
    pixelsPerDegreeValue: (ppd: string, shrunkToPct: number | null) =>
      `${ppd}${shrunkToPct != null ? `, stimuli shrunk to ${shrunkToPct}% of protocol size to fit` : ", stimuli at full protocol size"}`,
    window: "Window",
    fullScreen: "Full screen",
    notFullScreen: (widthPct: number) => `Not full screen, ${widthPct}% of the screen's width`,
    displayRefresh: "Display refresh",
    displayRefreshValue: (hz: string, frameMs: string) => `${hz} Hz, median frame ${frameMs} ms`,
    droppedFrames: "Dropped frames",
    droppedTask: { motion: "motion", form: "form flashes" },
    droppedValue: (task: string, dropped: string, frames: string, pct: string) => `${task} ${dropped} of ${frames} (${pct}%)`,
    easyChecks: "Easy check trials correct",
    easyCheckTask: { motion: "motion", form: "form" },
    easyChecksValue: (task: string, correct: number, total: number) => `${task} ${correct} of ${total}`,
    motionDisplay: "Motion display",
    motionDisplayValue: (ms: number) => `${ms} ms flash`,
    flashLength: "Flash length",
    flashLengthValue: (median: string, lo: string, hi: string) => `median ${median} ms, range ${lo}–${hi} ms (target 200 ms)`,
    ended: "Ended",
    endedEarly: "Early, at your request",
    browser: "Browser",
  },
};
