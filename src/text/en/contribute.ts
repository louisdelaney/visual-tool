// Step 1, the home page: what the test measures and whether to contribute (with a pseudonym), then
// the questions page. Its paragraphs and hints are in contribute.md.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {pseudonym}, {date} and the like are
// filled in by the page: keep them, and move them anywhere in the sentence.

export const contribute = {
  // What the test measures, at the top of the home page.
  measuresHeading: "What the test measures",

  // In place of the contribute form on a phone.
  phone: {
    heading: "The test can't run on this device",
  },

  // Contribute your results.
  contributeHeading: "Contribute your results",
  contributeQuestion: "Contribute anonymous data?",
  contributeYes: "Yes, add my results and answers to the public dataset",
  contributeNo: "No, send nothing",

  // The pseudonym box, shown after choosing Yes.
  pseudonymLabel: "Pseudonym (optional)",
  // The copy button's tooltip, and its label for screen readers.
  copy: "Copy",
  copyPseudonym: "Copy pseudonym",
  copied: "Copied",
  generate: "Generate one",
  generating: "Generating…",
  copiedStatus: "Copied your pseudonym.",
  copyBlocked: "Copying isn't allowed here. It's selected: press Ctrl+C, or ⌘C on a Mac.",

  // The questions page. With a pseudonym, it's the page's heading.
  // Read out before the pseudonym in the heading, for screen readers only.
  questionsFor: "Questions for",
  fillIn: "Fill in last answers",
  filling: "Filling in…",
  sentUnderPseudonym: "Your answers and results are sent under this pseudonym.",
  fillNone: "No earlier answers were found for {pseudonym}.",
  fillDone: "Filled in from your test on {date}. Check each answer and change anything that's different now.",
  fillFailed: "Your earlier answers couldn't be loaded. You can still fill them in yourself.",
  aboutYou: "About you",

  disorderQuestion: "Do you have, or suspect you have, a visual perceptual disorder?",
  conditionQuestion: "Which one?",
  conditions: { vss: "Visual snow syndrome (VSS)", hppd: "Hallucinogen persisting perception disorder (HPPD)", other: "Other" },
  otherConditionLabel: "Other disorder (optional, public)",
  otherConditionPlaceholder: "Which disorder? (optional)",
  diagnosedQuestion: "Have you been diagnosed by a doctor?",

  psychedelicsQuestion: "Have you ever used psychedelic drugs? (optional)",
  // Under an optional Yes/No question once it's answered.
  clearAnswer: "Clear answer",
  usesQuestion: "Estimate how many times",
  sinceQuestion: "How long since you last used them? (optional)",
  years: "years",
  months: "months",
  psychedelicsUsedQuestion: "Which ones have you used? (optional)",

  medicationQuestion: "Do you take any medications? (optional)",
  medicationsQuestion: "Which ones? (optional)",

  ageQuestion: "How old are you? (optional)",
  ageRanges: { "under-18": "Under 18", "18-24": "18 to 24", "25-34": "25 to 34", "35-44": "35 to 44", "45-54": "45 to 54", "55-64": "55 to 64", "65-plus": "65 or over" },

  extrasHeading: "Optional extras",
  notesLabel: "Notes (optional)",
  foundViaQuestion: "Where did you find us? (optional)",
  foundVia: { reddit: "Reddit", forum: "Forum", other: "Other" },
  // The box for "Other": its label for screen readers, and the text shown in it while empty.
  foundViaOtherLabel: "Where did you find us? (public)",
  foundViaOtherPlaceholder: "Where?",

  // Beside a required question left unanswered after Continue.
  errors: {
    contribute: "Please choose whether to contribute.",
    // Names the Yes and No answers: keep it matching "yes" and "no" in common.ts.
    yesOrNo: "Please choose Yes or No.",
    condition: "Please choose which disorder.",
    uses: "Please enter a whole number, 1 or more.",
    since: "Please use whole numbers, with months from 0 to 11, or leave both boxes blank.",
    // Under the Continue button.
    answerHighlighted: "Please answer the highlighted question above.",
  },

  // A list answer typed one entry at a time: the chips and their buttons, for screen readers.
  chips: {
    added: "Added: {n}",
    remove: "Remove {item}",
    // The + button beside each list.
    addPsychedelic: "Add psychedelic",
    addMedication: "Add medication",
  },
};
