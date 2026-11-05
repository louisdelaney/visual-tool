// The PDF summary: the words only it has. Most of what it shows are the results pages' own words,
// in labels.ts, and its notes are in site.md, history.md and pdf.md.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {name} is the test's name (from
// ../languages.ts), and {page}, {pseudonym} and the like are filled in as the PDF is made: keep
// them, and move them anywhere in the sentence. Where a sentence changes with a number, there's
// one entry for one and another for more than one.
// The PDF draws these as they are, so no <strong> or other formatting here.
// Show numbers only: no words that judge a result, like "normal" or "typical" (see AGENTS.md).

export const pdf = {
  // The title in the file's properties, which PDF viewers show: for one session, and for several.
  docTitleOne: "{name}: results summary",
  docTitleMany: "{name}: results summaries",
  // At the bottom of every page.
  footer: "{name} · Just for fun, not medical advice.",
  pageOf: "Page {page} of {pages}",

  // ---- The first page ----
  // With a pseudonym: for one session, and for several. Without one: resultsSummary.
  resultsForOne: "Results for {pseudonym}: {sessions} session",
  resultsForMany: "Results for {pseudonym}: {sessions} sessions, newest first",
  resultsSummary: "Results summary",

  // ---- One session ----
  // In bold, before the medications and the notes the person wrote: {label} is "Medications" or "Notes".
  labelBefore: "{label}:",
  // Under the Staircases heading: {subtitle} is the line the pages show there, here as a sentence.
  staircaseSubtitle: "{subtitle}.",
  // {testType} is "Full test" or "Quick test".
  testLine: "{testType} · test version {version}",
};
