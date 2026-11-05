// The Results page: the notice about sending, the save card, the staircases and the Session details.
import { fill, type Md } from "../markdown";
import type { Words } from "../words";

export const results = (w: Words, md: Md) => {
  const L = w.labels;
  const { removeFailed, removeFailedReference, savePdfDescription, saveSummaryDescription, saveFullDescriptionSent, saveFullDescriptionNotSent, rows: { pixelsPerDegreeFull, pixelsPerDegreeShrunk, ...rows }, ...r } = w.results;
  const quickNote = md("quickNote");
  const quickNoteSent = md("quickNoteSent");
  return {
    ...r,
    // ---- The notice in the header, carrying on from "just for fun" ----
    notSentNote: md("notSentNote"),
    anonymousNote: md("anonymousNote"),
    removed: md("removed"),
    sendingNotSetUp: md("sendingNotSetUp"),
    failureReference: (id: string) => fill(r.failureReference, { id }),
    // Taking a sent session back out of the database.
    removeOffer: md("removeOffer"),
    removeFailed: (reference: string | undefined) => (reference ? fill(removeFailedReference, { reference }) : removeFailed),

    // ---- The save card ----
    savePdf: { label: L.savePdf, description: savePdfDescription, pending: L.makingPdf },
    saveSummary: { label: L.saveSummary, description: saveSummaryDescription },
    saveFull: { label: L.saveFull, description: (contributing: boolean) => (contributing ? saveFullDescriptionSent : saveFullDescriptionNotSent) },
    quickNote: (contributing: boolean) => (contributing ? quickNoteSent : quickNote),
    // Read by screen readers before the pseudonym, so each ends with a space.
    seeAllFor: `${r.seeAllFor} `,
    yourPseudonym: `${r.yourPseudonym} `,
    savedUnderPseudonym: md("savedUnderPseudonym"),
    findAgainPseudonym: md("findAgainPseudonym"),

    // ---- Staircases ----
    staircasesHeading: L.staircasesHeading,
    staircaseSubtitle: L.staircaseSubtitle,
    noTrials: L.noTrials,

    // ---- Session details: a label and a value on each row. Numbers arrive already formatted. ----
    rows: {
      ...rows,
      testValue: (testType: string, stopReversals: number, meanOfLast: number) => fill(rows.testValue, { testType, stopReversals, meanOfLast }),
      screenScaleValue: (pxPerMm: string, cardPx: string) => fill(rows.screenScaleValue, { pxPerMm, cardPx }),
      viewingDistance: L.viewingDistance,
      viewingDistanceValue: (cm: string, how: string) => fill(rows.viewingDistanceValue, { cm, how }),
      distanceBlindSpot: (readings: number, lo: string, hi: string) => fill(rows.distanceBlindSpot, { readings, lo, hi }),
      pixelsPerDegreeRange: (lo: string, hi: string) => fill(rows.pixelsPerDegreeRange, { lo, hi }),
      /** `shrunkToPct` is null when the stimuli were drawn at full size. */
      pixelsPerDegreeValue: (ppd: string, shrunkToPct: number | null) => (shrunkToPct != null ? fill(pixelsPerDegreeShrunk, { ppd, pct: shrunkToPct }) : fill(pixelsPerDegreeFull, { ppd })),
      notFullScreen: (widthPct: number) => fill(rows.notFullScreen, { widthPct }),
      displayRefreshValue: (hz: string, frameMs: string) => fill(rows.displayRefreshValue, { hz, frameMs }),
      droppedValue: (task: string, dropped: string, frames: string, pct: string) => fill(rows.droppedValue, { task, dropped, frames, pct }),
      easyChecksValue: (task: string, correct: number, total: number) => fill(rows.easyChecksValue, { task, correct, total }),
      motionDisplayValue: (ms: number) => fill(rows.motionDisplayValue, { ms }),
      flashLengthValue: (median: string, lo: string, hi: string) => fill(rows.flashLengthValue, { median, lo, hi }),
    },
  };
};
