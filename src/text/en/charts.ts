// The parts shared by both results pages, and the PDF where noted: the numbers and the sentence
// about them, the comparison with the groups, the charts, what the numbers mean, and the save menu.
// The paragraphs are in charts.md. AGENTS.md applies to every line: describe the numbers, never the
// person. No words that judge a result ("normal", "typical", "healthy", "below most people" and the
// like) and nothing medical.
import source from "./charts.md";
import { markdown } from "../markdown";

const md = markdown(source, "charts.md");
const same = md.template("summary.same");
const motionFewer = md.template("summary.motionFewer");
const formFewer = md.template("summary.formFewer");
const sensitivityNote = md("groups.sensitivityNote");
const sensitivityNoteWithGroups = md("groups.sensitivityNoteWithGroups");
const groupBars = md("explained.groupBars");
const groupBarsWithThresholdCharts = md("explained.groupBarsWithThresholdCharts");

export const charts = {
  taskName: { motion: "Motion", form: "Form" },

  /** The tiles and the sentence under them. */
  summary: {
    threshold: (task: string) => `${task} threshold`,
    notRun: "Not run",
    sensitivity: (v: string) => `sensitivity ${v}`,
    scoredTrials: (n: number) => ` · ${n} scored trials`,
    endedEarly: "Ended early",
    noThreshold: "No threshold",
    diff: "Motion minus form sensitivity",
    ratio: (v: string) => `motion ÷ form threshold ${v}`,
    needsBoth: "Needs both thresholds",
    noDiff: md("summary.noDiff"),
    same: (m: string, f: string) => same({ motion: m, form: f }),
    motionFewer: (m: string, f: string) => motionFewer({ motion: m, form: f }),
    formFewer: (m: string, f: string) => formFewer({ motion: m, form: f }),
  },

  /** Under the tiles. */
  runNotes: {
    takenOn: (how: string) => `Taken on: ${how}`,
    medications: "Medications",
    notes: "Notes",
  },

  /** The groups, also used in the PDF. */
  groups: {
    heading: "Compared with other groups",
    loading: "Loading the comparison…",
    loadFailed: "Couldn't load the comparison. Check your connection and try again.",
    /** Only in development, never in a build. */
    sample: "Sample data for development. These are not real groups.",
    control: { name: "Control group", who: "no visual perceptual disorder, never used psychedelic drugs" },
    psychedelics: { name: "Used psychedelics", who: "no visual perceptual disorder, have used psychedelic drugs" },
    introQuick: md("groups.introQuick"),
    introFull: md("groups.introFull"),
    /** After the group's name in the list. */
    line: (who: string, n: number) => `${who}. ${n} ${n === 1 ? "person" : "people"} so far.`,
    sensitivityNote: (anyShown: boolean) => (anyShown ? sensitivityNoteWithGroups : sensitivityNote),
    thresholdChartsNote: md("groups.thresholdChartsNote"),
    quantiles: (median: string, p25: string, p75: string, p10: string, p90: string) => `median ${median}, middle half ${p25} to ${p75}, middle 80% ${p10} to ${p90}`,
  },

  /** Each measure on the threshold charts and in the PDF. `reading` says what higher or lower means. */
  measures: {
    motion_threshold_pct: { title: "Motion threshold", reading: md("measures.motionThreshold") },
    form_threshold_pct: { title: "Form threshold", reading: md("measures.formThreshold") },
    motion_minus_form: { title: "Motion minus form sensitivity", reading: md("measures.motionMinusForm") },
  },

  /** One row of the threshold charts. */
  thresholdRow: {
    noValue: "This run didn't reach a value for this.",
    value: (v: string) => `This run: ${v}.`,
    group: (name: string, numbers: string) => `${name}: ${numbers}.`,
  },

  /** The sensitivity bars. */
  bars: {
    motion: "Motion",
    form: "Form",
    diff: "Motion − form",
    thisRun: "This run",
    people: (n: number) => `${n} people`,
    axis: "Sensitivity",
    /** Read out by screen readers, before each set of bars is described. */
    described: (sets: string) => `Sensitivity. ${sets}`,
    noValue: (series: string) => `${series} no value`,
    range: (series: string, median: string, p25: string, p75: string) => `${series} median ${median}, middle half ${p25} to ${p75}`,
    single: (series: string, v: string) => `${series} ${v}`,
    /** Shown on hover over one bar. */
    barTipRange: (set: string, series: string, median: string, p25: string, p75: string) => `${set}, ${series.toLowerCase()}: median ${median}, middle half ${p25} to ${p75}`,
    barTip: (set: string, series: string, v: string) => `${set}, ${series.toLowerCase()}: ${v}`,
  },

  /** The staircase charts. */
  staircase: {
    described: (task: string, n: number, threshold: string) => `${task} staircase: ${n} scored trials, threshold ${threshold}`,
    notReached: "not reached",
    trial: "Trial",
    threshold: "Threshold",
    tip: (n: number, pct: string, correct: boolean, reversal: boolean) => `Trial ${n} · ${pct} · ${correct ? "correct" : "wrong"}${reversal ? " · reversal" : ""}`,
    keyCorrect: "Correct",
    keyWrong: "Wrong",
    keyReversal: "Reversal",
    keyThreshold: "Threshold, averaged from the last reversals",
  },

  /** "What the numbers mean", also in the PDF. */
  explained: {
    heading: "What the numbers mean",
    lead: md("explained.lead"),
    more: "More about each number",
    threshold: { title: "Threshold", text: md("explained.threshold") },
    motionAndForm: { title: "Motion and form", text: md("explained.motionAndForm") },
    sensitivity: { title: "Sensitivity", text: md("explained.sensitivity") },
    diff: { title: "Motion − form", text: md("explained.diff") },
    groupBars: {
      title: "The group bars",
      text: (thresholdCharts: boolean) => (thresholdCharts ? groupBarsWithThresholdCharts : groupBars),
    },
    varies: { title: "Why it varies", text: md("explained.varies") },
  },

  /** The floppy-disk save menu and the note under it. */
  save: {
    label: "Save your results",
    getting: "Getting the data…",
    saved: (file: string) => `Saved ${file}.`,
    failed: "Couldn't save it.",
  },
};
