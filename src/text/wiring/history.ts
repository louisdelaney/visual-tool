// The Results by pseudonym page, and the lines about how a run was taken that both results pages
// and the PDF show.
import { fill, type Md } from "../markdown";
import type { Words } from "../words";
import { singularFor } from "./plural";

export const history = (w: Words, md: Md) => {
  const L = w.labels;
  const h = w.history;
  const singular = singularFor(w.common.locale);
  const missedOneCheck = md("run.missedOneCheck");
  const missedChecks = md.template("run.missedChecks");
  return {
    // ---- Looking up a pseudonym ----
    heading: L.resultsByPseudonym,
    intro: md("intro"),
    notAvailable: md("notAvailable"),
    pseudonymLabel: h.pseudonymLabel,
    showResults: h.showResults,
    lookingUp: (pseudonym: string) => fill(h.lookingUp, { pseudonym }),
    loadFailed: (pseudonym: string) => fill(h.loadFailed, { pseudonym }),
    noResults: (pseudonym: string) => fill(h.noResults, { pseudonym }),

    // ---- Every session ----
    saveAllLabel: h.saveAllLabel,
    saveAllButton: h.saveAllButton,
    saveAllPdf: { label: h.saveAllPdf, description: (pseudonym: string) => fill(h.saveAllPdfDescription, { pseudonym }) },
    saveAllSummaries: { label: h.saveAllSummaries, description: (pseudonym: string) => fill(h.saveAllSummariesDescription, { pseudonym }) },
    saveAllRaw: { label: L.saveFull, description: (pseudonym: string) => fill(h.saveAllRawDescription, { pseudonym }) },
    /** Development only. */
    sampleBanner: L.sampleHistory,
    sessionsHeading: (pseudonym: string, count: number) => fill(singular(count) ? h.sessionsHeadingOne : h.sessionsHeadingMany, { pseudonym, count }),
    justForFun: md("justForFun"),
    practice: md("practice"),
    staircasesHint: md("staircasesHint"),
    selectHint: md("selectHint"),
    // Shown by the save menus when saving fails.
    fetchFailed: h.fetchFailed,
    sessionMissing: h.sessionMissing,

    // ---- One session ----
    selectTitle: h.selectTitle,
    selectLabel: h.selectLabel,
    saveOneLabel: h.saveOneLabel,
    savePdf: { label: L.savePdf, description: h.savePdfDescription },
    saveSummary: { label: L.saveSummary, description: h.saveSummaryDescription },
    saveFull: { label: L.saveFull, description: h.saveFullDescription },
    makingPdf: L.makingPdf,
    quickNote: md("quickNote"),
    earlierVersion: md("earlierVersion"),
    groupsHeading: L.groupsHeading,
    staircaseSubtitle: L.staircaseSubtitle,
    noStaircases: L.noStaircases,

    // ---- The bar pinned to the bottom while sessions are selected ----
    selectionLabel: h.selectionLabel,
    /** The count is a number; <strong> marks it. */
    selectedCount: (count: number) => fill(singular(count) ? h.selectedOne : h.selectedMany, { count }),
    clear: h.clear,
    saveAsPdf: h.saveAsPdf,
    saved: (filename: string) => fill(L.saved, { file: filename }),
    couldntSave: L.couldntSave,

    // ---- How a run was taken, on both results pages and in the PDF (plain text, no tags) ----
    run: {
      device: h.run.device,
      distance: (cm: string) => fill(h.run.distance, { cm }),
      fullScreen: h.run.fullScreen,
      notFullScreen: h.run.notFullScreen,
      /** Between the parts of "Computer · 55 cm away · full screen". */
      separator: ` ${w.common.separator} `,
      missedChecks: (missed: number) => (singular(missed) ? missedOneCheck : missedChecks({ missed })),
    },
  };
};
