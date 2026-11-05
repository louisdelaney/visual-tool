// The parts shared by both results pages, and the PDF where noted: the numbers and the sentence
// about them, the comparison with the groups, the charts, what the numbers mean, and the save menu.
// Numbers arrive already formatted.
import { fill, type Md } from "../markdown";
import type { Words } from "../words";
import { singularFor } from "./plural";

export const charts = (w: Words, md: Md) => {
  const L = w.labels;
  const c = w.charts;
  const singular = singularFor(w.common.locale);
  const same = md.template("summary.same");
  const motionFewer = md.template("summary.motionFewer");
  const formFewer = md.template("summary.formFewer");
  const sensitivityNote = md("groups.sensitivityNote");
  const sensitivityNoteWithGroups = md("groups.sensitivityNoteWithGroups");
  const groupBars = md("explained.groupBars");
  const groupBarsWithThresholdCharts = md("explained.groupBarsWithThresholdCharts");
  return {
    taskName: { motion: L.motion, form: L.form },

    /** The tiles and the sentence under them. */
    summary: {
      threshold: { motion: L.motionThreshold, form: L.formThreshold },
      notRun: L.notRun,
      sensitivity: (v: string) => fill(L.sensitivityLine, { value: v }),
      /** After the sensitivity, on the same line. */
      scoredTrials: (n: number) => ` ${w.common.separator} ${fill(L.scoredTrials, { n })}`,
      endedEarly: L.endedEarly,
      noThreshold: L.noThreshold,
      diff: L.motionMinusFormSensitivity,
      ratio: (v: string) => fill(L.thresholdRatio, { value: v }),
      needsBoth: L.needsBoth,
      noDiff: md("summary.noDiff"),
      same: (m: string, f: string) => same({ motion: m, form: f }),
      motionFewer: (m: string, f: string) => motionFewer({ motion: m, form: f }),
      formFewer: (m: string, f: string) => formFewer({ motion: m, form: f }),
    },

    /** Under the tiles. */
    runNotes: {
      takenOn: (how: string) => fill(L.takenOn, { how }),
      medications: L.medications,
      notes: L.notes,
    },

    /** The groups, also used in the PDF. */
    groups: {
      heading: L.groupsHeading,
      loading: c.groups.loading,
      loadFailed: c.groups.loadFailed,
      /** Only in development, never in a build. */
      sample: L.sampleGroups,
      control: c.groups.control,
      psychedelics: c.groups.psychedelics,
      introQuick: md("groups.introQuick"),
      introFull: md("groups.introFull"),
      /** After the group's name in the list. */
      line: (who: string, n: number) => fill(singular(n) ? c.groups.lineOne : c.groups.lineMany, { who, n }),
      sensitivityNote: (anyShown: boolean) => (anyShown ? sensitivityNoteWithGroups : sensitivityNote),
      thresholdChartsNote: md("groups.thresholdChartsNote"),
      quantiles: (median: string, p25: string, p75: string, p10: string, p90: string) => fill(c.groups.quantiles, { median, p25, p75, p10, p90 }),
    },

    /** Each measure on the threshold charts and in the PDF. `reading` says what higher or lower means. */
    measures: {
      motion_threshold_pct: { title: L.motionThreshold, reading: md("measures.motionThreshold") },
      form_threshold_pct: { title: L.formThreshold, reading: md("measures.formThreshold") },
      motion_minus_form: { title: L.motionMinusFormSensitivity, reading: md("measures.motionMinusForm") },
    },

    /** One row of the threshold charts. */
    thresholdRow: {
      noValue: L.noValue,
      value: (v: string) => fill(L.thisRunValue, { value: v }),
      group: (name: string, numbers: string) => fill(L.groupValue, { group: name, numbers }),
    },

    /** The sensitivity bars. */
    bars: {
      motion: L.motion,
      form: L.form,
      diff: L.motionMinusForm,
      thisRun: L.thisRun,
      people: (n: number) => fill(L.people, { n }),
      axis: L.sensitivity,
      /** Read out by screen readers, before each set of bars is described. */
      described: (sets: string) => fill(c.bars.described, { sets }),
      noValue: (series: string) => fill(c.bars.noValue, { series }),
      range: (series: string, median: string, p25: string, p75: string) => fill(c.bars.range, { series, median, p25, p75 }),
      single: (series: string, v: string) => fill(c.bars.single, { series, value: v }),
      /** Shown on hover over one bar. The series comes mid-sentence, so each language writes it for there. */
      barTipRange: (set: string, series: keyof typeof c.bars.inSentence, median: string, p25: string, p75: string) => fill(c.bars.tipRange, { set, series: c.bars.inSentence[series], median, p25, p75 }),
      barTip: (set: string, series: keyof typeof c.bars.inSentence, v: string) => fill(c.bars.tip, { set, series: c.bars.inSentence[series], value: v }),
    },

    /** The staircase charts. */
    staircase: {
      described: (task: string, n: number, threshold: string) => fill(c.staircase.described, { task, n, threshold }),
      notReached: c.staircase.notReached,
      trial: L.trial,
      threshold: L.threshold,
      /** Shown on hover over one trial. */
      tip: (n: number, pct: string, correct: boolean, reversal: boolean) => fill(reversal ? c.staircase.tipReversal : c.staircase.tip, { n, pct, answer: correct ? c.staircase.correct : c.staircase.wrong }),
      keyCorrect: L.keyCorrect,
      keyWrong: L.keyWrong,
      keyReversal: L.keyReversal,
      keyThreshold: L.keyThreshold,
    },

    /** "What the numbers mean", also in the PDF. */
    explained: {
      heading: L.numbersHeading,
      lead: md("explained.lead"),
      more: c.explained.more,
      threshold: { title: L.threshold, text: md("explained.threshold") },
      motionAndForm: { title: c.explained.motionAndForm, text: md("explained.motionAndForm") },
      sensitivity: { title: L.sensitivity, text: md("explained.sensitivity") },
      diff: { title: L.motionMinusForm, text: md("explained.diff") },
      groupBars: {
        title: c.explained.groupBars,
        text: (thresholdCharts: boolean) => (thresholdCharts ? groupBarsWithThresholdCharts : groupBars),
      },
      varies: { title: c.explained.varies, text: md("explained.varies") },
    },

    /** The floppy-disk save menu and the note under it. */
    save: {
      label: c.save.label,
      getting: c.save.getting,
      saved: (file: string) => fill(L.saved, { file }),
      failed: L.couldntSave,
    },
  };
};
