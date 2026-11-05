// The parts both results pages share: the comparison with the groups, the charts, what the numbers
// mean, and the save menu. Its paragraphs are in charts.md, and the words the PDF shows too are in
// labels.ts.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {n}, {median} and the like are filled in
// by the page: keep them, and move them anywhere in the sentence. Where a sentence changes with a
// number, there's one entry for one and another for more than one.
// AGENTS.md applies to every line: describe the numbers, never the person. No words that judge a
// result ("normal", "typical", "healthy", "below most people" and the like) and nothing medical.

export const charts = {
  // The groups, also in the PDF.
  groups: {
    loading: "Loading the comparison…",
    loadFailed: "Couldn't load the comparison. Check your connection and try again.",
    // Each group: its name, and who's in it. `who` follows the name and a colon, so it starts in lower case.
    control: { name: "Control group", who: "no visual perceptual disorder, never used psychedelic drugs" },
    psychedelics: { name: "Used psychedelics", who: "no visual perceptual disorder, have used psychedelic drugs" },
    // After the group's name in the list. {who} is the group's `who` above.
    lineOne: "{who}. {n} person so far.",
    lineMany: "{who}. {n} people so far.",
    quantiles: "median {median}, middle half {p25} to {p75}, middle 80% {p10} to {p90}",
  },

  // The sensitivity bars, described for screen readers. {series} is "Motion", "Form" or "Motion − form",
  // except where noted.
  bars: {
    described: "Sensitivity. {sets}",
    noValue: "{series} no value",
    range: "{series} median {median}, middle half {p25} to {p75}",
    single: "{series} {value}",
    // Shown on hover over one bar. {set} is "This run" or a group's name.
    tipRange: "{set}, {series}: median {median}, middle half {p25} to {p75}",
    tip: "{set}, {series}: {value}",
    // {series} in the two lines above: each bar's name as it's written in the middle of a sentence.
    inSentence: { motion: "motion", form: "form", diff: "motion − form" },
  },

  // The staircase charts.
  staircase: {
    // For screen readers. {task} is "Motion" or "Form".
    described: "{task} staircase: {n} scored trials, threshold {threshold}",
    // In place of {threshold} when there isn't one.
    notReached: "not reached",
    // Shown on hover over one trial: an ordinary one, and one where the staircase turned.
    // {answer} is one of the two words after them.
    tip: "Trial {n} · {pct} · {answer}",
    tipReversal: "Trial {n} · {pct} · {answer} · reversal",
    correct: "correct",
    wrong: "wrong",
  },

  // "What the numbers mean": the titles of its parts. The other titles are in labels.ts.
  explained: {
    more: "More about each number",
    motionAndForm: "Motion and form",
    groupBars: "The group bars",
    varies: "Why it varies",
  },

  // The floppy-disk save menu and the note under it.
  save: {
    label: "Save your results",
    getting: "Getting the data…",
  },
};
