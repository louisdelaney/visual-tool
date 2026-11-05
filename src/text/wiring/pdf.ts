// The PDF summary. Most of its words are the results pages' own, so they come from the labels, and
// its notes from the header's and the Results by pseudonym page's Markdown. It's drawn as plain
// text: bold in a shared paragraph is drawn, but nothing else is.
import { fill, type Md } from "../markdown";
import type { Words } from "../words";

/** The paragraphs the PDF shares with the pages. */
interface Shared {
  funNotice: string;
  practice: string;
  quickNote: string;
  earlierVersion: string;
}

export const pdf = (w: Words, md: Md, name: string, shared: Shared) => {
  const L = w.labels;
  const p = w.pdf;
  return {
    title: name,
    /** The title in the file's properties, which PDF viewers show. */
    docTitle: (many: boolean) => fill(many ? p.docTitleMany : p.docTitleOne, { name }),
    footer: fill(p.footer, { name }),
    pageOf: (page: number, pages: number) => fill(p.pageOf, { page, pages }),

    // ---- The first page ----
    resultsFor: (pseudonym: string, sessions: number, many: boolean) => fill(many ? p.resultsForMany : p.resultsForOne, { pseudonym, sessions }),
    resultsSummary: p.resultsSummary,
    funNotice: shared.funNotice,
    /** Development only. */
    sampleHistory: L.sampleHistory,
    practice: shared.practice,

    // ---- One session ----
    takenOnLine: (takenOn: string) => fill(L.takenOn, { how: takenOn }),
    testLine: (testType: string, version: number) => fill(p.testLine, { testType, version }),
    quickNote: shared.quickNote,
    // In bold, before what the person wrote, so each ends with a space.
    medications: `${fill(p.labelBefore, { label: L.medications })} `,
    notes: `${fill(p.labelBefore, { label: L.notes })} `,

    // The three tiles.
    threshold: { motion: L.motionThreshold, form: L.formThreshold },
    notRun: L.notRun,
    endedEarly: L.endedEarly,
    noThreshold: L.noThreshold,
    sensitivityLine: (sensitivity: string, scoredTrials: number | null) => `${fill(L.sensitivityLine, { value: sensitivity })}${scoredTrials != null ? ` ${w.common.separator} ${fill(L.scoredTrials, { n: scoredTrials })}` : ""}`,
    diffTitle: L.motionMinusFormSensitivity,
    diffLine: (ratio: string) => fill(L.thresholdRatio, { value: ratio }),
    needsBoth: L.needsBoth,

    // ---- Compared with other groups ----
    groupsHeading: L.groupsHeading,
    earlierVersion: shared.earlierVersion,
    groupsNotLoaded: md("groupsNotLoaded"),
    /** Development only. */
    sampleGroups: L.sampleGroups,
    // The sensitivity bars.
    bars: { motion: L.motion, form: L.form, diff: L.motionMinusForm },
    thisRun: L.thisRun,
    people: (n: number) => fill(L.people, { n }),
    sensitivityAxis: L.sensitivity,
    // Under each threshold chart.
    noValue: L.noValue,
    thisRunValue: (value: string) => fill(L.thisRunValue, { value }),
    groupValue: (group: string, ranges: string) => fill(L.groupValue, { group, numbers: ranges }),

    // ---- Staircases ----
    staircasesHeading: L.staircasesHeading,
    staircaseSubtitle: fill(p.staircaseSubtitle, { subtitle: L.staircaseSubtitle }),
    noStaircases: L.noStaircases,
    task: { motion: L.motion, form: L.form },
    trialAxis: L.trial,
    noTrials: L.noTrials,
    thresholdLabel: L.threshold,
    key: { correct: L.keyCorrect, wrong: L.keyWrong, reversal: L.keyReversal, threshold: L.keyThreshold },

    // ---- The last page ----
    numbersHeading: L.numbersHeading,
  };
};
