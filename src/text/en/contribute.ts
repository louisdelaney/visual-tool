// Step 1, the home page: what the test measures and whether to contribute (with a pseudonym), then
// the questions page. Also the list-answer boxes on the questions page (ChipInput). The paragraphs
// and hints are in contribute.md.
import source from "./contribute.md";
import { markdown } from "../markdown";

const md = markdown(source, "contribute.md");

export const contribute = {
  // What the test measures, at the top of the home page.
  measuresHeading: "What the test measures",
  measuresIntro: md("measuresIntro"),
  measuresCompare: md("measuresCompare"),
  noGoodOrBad: md("noGoodOrBad"),
  usualSelf: md("usualSelf"),

  /** In place of the contribute form on a phone. */
  phone: {
    heading: "The test can't run on this device",
    notice: md("phone.notice"),
    others: md("phone.others"),
  },
  tablet: md("tablet"),

  // Contribute your results.
  contributeHeading: "Contribute your results",
  contributeIntro: md("contributeIntro"),
  publicAnonymous: md("publicAnonymous"),
  nothingLogged: md("nothingLogged"),
  privacyAndHistory: md("privacyAndHistory"),
  contributeQuestion: "Contribute anonymous data?",
  contributeYes: "Yes, add my results and answers to the public dataset",
  contributeNo: "No, send nothing",

  // The pseudonym box, shown after choosing Yes.
  pseudonymLabel: "Pseudonym (optional)",
  /** The copy button's tooltip, and its label for screen readers. */
  copy: "Copy",
  copyPseudonym: "Copy pseudonym",
  copied: "Copied",
  generate: "Generate one",
  generating: "Generating…",
  copiedStatus: "Copied your pseudonym.",
  copyBlocked: "Copying isn't allowed here. It's selected: press Ctrl+C, or ⌘C on a Mac.",
  pseudonymHint: md("pseudonymHint"),

  // The questions page. With a pseudonym, it's the page's heading.
  /** Read out before the pseudonym in the heading, for screen readers only. Keep the space at the end. */
  questionsFor: "Questions for ",
  fillIn: "Fill in last answers",
  filling: "Filling in…",
  sentUnderPseudonym: "Your answers and results are sent under this pseudonym.",
  fillNone: (pseudonym: string) => `No earlier answers were found for ${pseudonym}.`,
  fillDone: (date: string) => `Filled in from your test on ${date}. Check each answer and change anything that's different now.`,
  fillFailed: "Your earlier answers couldn't be loaded. You can still fill them in yourself.",
  aboutYou: "About you",

  disorderQuestion: "Do you have, or suspect you have, a visual perceptual disorder?",
  conditionQuestion: "Which one?",
  conditions: { vss: "Visual snow syndrome (VSS)", hppd: "Hallucinogen persisting perception disorder (HPPD)", other: "Other" },
  otherConditionLabel: "Other disorder (optional, public)",
  otherConditionPlaceholder: "Which disorder? (optional)",
  diagnosedQuestion: "Have you been diagnosed by a doctor?",

  psychedelicsQuestion: "Have you ever used psychedelic drugs? (optional)",
  /** Under an optional Yes/No question once it's answered. */
  clearAnswer: "Clear answer",
  usesQuestion: "Estimate how many times",
  sinceQuestion: "How long since you last used them? (optional)",
  years: "years",
  months: "months",
  sinceHint: md("sinceHint"),
  psychedelicsUsedQuestion: "Which ones have you used? (optional)",
  /** One entry in the list, for its + button: "Add psychedelic". */
  psychedelicNoun: "psychedelic",
  psychedelicsUsedHint: md("psychedelicsUsedHint"),

  medicationQuestion: "Do you take any medications? (optional)",
  medicationsQuestion: "Which ones? (optional)",
  /** One entry in the list, for its + button: "Add medication". */
  medicationNoun: "medication",
  medicationsHint: md("medicationsHint"),

  ageQuestion: "How old are you? (optional)",
  ageRanges: { "under-18": "Under 18", "18-24": "18 to 24", "25-34": "25 to 34", "35-44": "35 to 44", "45-54": "45 to 54", "55-64": "55 to 64", "65-plus": "65 or over" },

  extrasHeading: "Optional extras",
  notesLabel: "Notes (optional)",
  notesHint: md("notesHint"),
  foundViaQuestion: "Where did you find us? (optional)",
  foundVia: { reddit: "Reddit", forum: "Forum", other: "Other" },
  /** The box for "Other": its label for screen readers, and the text shown in it while empty. */
  foundViaOtherLabel: "Where did you find us? (public)",
  foundViaOtherPlaceholder: "Where?",
  foundViaOtherHint: md("foundViaOtherHint"),

  /** Beside a required question left unanswered after Continue. */
  errors: {
    contribute: "Please choose whether to contribute.",
    /** Names the Yes and No answers: keep it matching common.yes and common.no. */
    yesOrNo: "Please choose Yes or No.",
    condition: "Please choose which disorder.",
    uses: "Please enter a whole number, 1 or more.",
    since: "Please use whole numbers, with months from 0 to 11, or leave both boxes blank.",
    /** Under the Continue button. */
    answerHighlighted: "Please answer the highlighted question above.",
  },

  /** A list answer typed one entry at a time: the chips and their buttons, for screen readers. */
  chips: {
    added: (n: number) => `Added: ${n}`,
    remove: (item: string) => `Remove ${item}`,
    add: (noun: string) => `Add ${noun}`,
  },
};
