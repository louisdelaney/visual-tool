// The PDF summary. Its paragraphs are in pdf.md, and the notes it shares with the pages come from
// site.md and history.md. The labels here are drawn as they are, so no tags in them: bold in a
// shared paragraph is drawn, but nothing else is.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).
import source from "./pdf.md";
import { markdown } from "../markdown";
import { history } from "./history";
import { site } from "./site";

const md = markdown(source, "pdf.md");

export const pdf = {
  title: "Form–Motion Coherence Test",
  /** The title in the file's properties, which PDF viewers show. */
  docTitle: (many: boolean) => `Form–Motion Coherence Test: ${many ? "results summaries" : "results summary"}`,
  footer: "Form–Motion Coherence Test · Just for fun, not medical advice.",
  pageOf: (page: number, pages: number) => `Page ${page} of ${pages}`,

  // ---- The first page ----
  resultsFor: (pseudonym: string, sessions: number, many: boolean) => `Results for ${pseudonym}: ${sessions} ${many ? "sessions, newest first" : "session"}`,
  resultsSummary: "Results summary",
  /** The notice at the top: the same words as the home and Results pages (site.md). */
  funNotice: site.funNotice,
  /** Development only. */
  sampleHistory: "Sample data for development. This isn't anyone's real history.",
  /** The same words as the Results by pseudonym page (history.md). */
  practice: history.practice,

  // ---- One session ----
  takenOnLine: (takenOn: string) => `Taken on: ${takenOn}`,
  testLine: (testType: string, version: number) => `${testType} · test version ${version}`,
  /** The same words as the Results by pseudonym page (history.md). */
  quickNote: history.quickNote,
  // In bold, before what the person wrote; the trailing space matters.
  medications: "Medications: ",
  notes: "Notes: ",

  // The three tiles.
  threshold: { motion: "Motion threshold", form: "Form threshold" },
  notRun: "Not run",
  endedEarly: "Ended early",
  noThreshold: "No threshold",
  sensitivityLine: (sensitivity: string, scoredTrials: number | null) => `sensitivity ${sensitivity}${scoredTrials != null ? ` · ${scoredTrials} scored trials` : ""}`,
  diffTitle: "Motion minus form sensitivity",
  diffLine: (ratio: string) => `motion ÷ form threshold ${ratio}`,
  needsBoth: "Needs both thresholds",

  // ---- Compared with other groups ----
  groupsHeading: "Compared with other groups",
  /** The same words as the Results by pseudonym page (history.md). */
  earlierVersion: history.earlierVersion,
  groupsNotLoaded: md("groupsNotLoaded"),
  /** Development only. */
  sampleGroups: "Sample data for development. These are not real groups.",
  // The sensitivity bars.
  bars: { motion: "Motion", form: "Form", diff: "Motion − form" },
  thisRun: "This run",
  people: (n: number) => `${n} people`,
  sensitivityAxis: "Sensitivity",
  // Under each threshold chart.
  noValue: "This run didn't reach a value for this.",
  thisRunValue: (value: string) => `This run: ${value}.`,
  groupValue: (group: string, ranges: string) => `${group}: ${ranges}.`,

  // ---- Staircases ----
  staircasesHeading: "Staircases",
  staircaseSubtitle: "Coherence (%) on each scored trial, log scale.",
  noStaircases: "No staircases were kept for this session.",
  task: { motion: "Motion", form: "Form" },
  trialAxis: "Trial",
  noTrials: "No trials were completed.",
  thresholdLabel: "Threshold",
  key: { correct: "Correct", wrong: "Wrong", reversal: "Reversal", threshold: "Threshold, averaged from the last reversals" },

  // ---- The last page ----
  numbersHeading: "What the numbers mean",
};
