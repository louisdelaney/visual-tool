// Step 1, the home page: what the test measures and whether to contribute (with a pseudonym), then
// the questions page, and the list-answer boxes on it (ChipInput).
import { fill, type Md } from "../markdown";
import type { Words } from "../words";

export const contribute = (w: Words, md: Md) => {
  const c = w.contribute;
  return {
    ...c,
    measuresIntro: md("measuresIntro"),
    measuresCompare: md("measuresCompare"),
    noGoodOrBad: md("noGoodOrBad"),
    usualSelf: md("usualSelf"),
    /** In place of the contribute form on a phone. */
    phone: { ...c.phone, notice: md("phone.notice"), others: md("phone.others") },
    tablet: md("tablet"),
    contributeIntro: md("contributeIntro"),
    publicAnonymous: md("publicAnonymous"),
    nothingLogged: md("nothingLogged"),
    privacyAndHistory: md("privacyAndHistory"),
    pseudonymHint: md("pseudonymHint"),
    /** Read out before the pseudonym in the heading, so it ends with a space. */
    questionsFor: `${c.questionsFor} `,
    fillNone: (pseudonym: string) => fill(c.fillNone, { pseudonym }),
    fillDone: (date: string) => fill(c.fillDone, { date }),
    sinceHint: md("sinceHint"),
    psychedelicsUsedHint: md("psychedelicsUsedHint"),
    medicationsHint: md("medicationsHint"),
    notesHint: md("notesHint"),
    foundViaOtherHint: md("foundViaOtherHint"),
    /** A list answer typed one entry at a time: the chips and their buttons, for screen readers. */
    chips: {
      added: (n: number) => fill(c.chips.added, { n }),
      remove: (item: string) => fill(c.chips.remove, { item }),
      addPsychedelic: c.chips.addPsychedelic,
      addMedication: c.chips.addMedication,
    },
  };
};
