// What each number on the results pages measures, in plain terms: shared by the pages' "What the
// numbers mean" and the PDF summaries. It describes the measures, never the person: nothing here
// ranks a result or reads anything into where it falls.

export const EXPLAIN_LEAD = "There's no right or wrong result, and no good or bad score. Each number describes how one run went, on one screen, on one day. It's just for fun.";

export interface Explanation {
  title: string;
  text: string;
}

/**
 * Each measure's explanation. `groups`: whether group bars are shown, so their parts need
 * explaining; `thresholdCharts`: whether the threshold charts, with their middle-80% band, are too.
 */
export function explanations({ groups, thresholdCharts = false }: { groups: boolean; thresholdCharts?: boolean }): Explanation[] {
  return [
    { title: "Threshold", text: "In both tasks, only some of the dots were organised and the rest were random. After correct answers the test lowered the share of organised dots, and after a mistake it raised it again, until it settled where you were right about four times in five. That share is your threshold. A 10% threshold means that with 10 dots in every 100 organised, you picked the right answer about four times in five." },
    { title: "Motion and form", text: "The motion threshold is how much of the dots had to drift together before you could tell which way they went. The form threshold is how much had to line up into the starburst before you could tell which flash held it. They're two different kinds of seeing, so the two numbers don't have to match." },
    { title: "Sensitivity", text: "Sensitivity turns the threshold around: it's 1 ÷ the threshold in percent. A 10% threshold is a sensitivity of 0.1, and a 5% threshold is 0.2. A smaller threshold and a taller sensitivity bar say the same thing: less organised signal was needed to pick out the pattern." },
    { title: "Motion − form", text: "Your motion sensitivity minus your form sensitivity. Above zero, you needed less organised signal to see the moving dots than the starburst. Below zero, the starburst needed less. Near zero, about the same for both. It compares your two tasks with each other, and it isn't a score." },
    ...(groups ? [{ title: "The group bars", text: `A group's bar is its median: half the group's results are above it and half below. The line across the bar covers the middle half, leaving out the top and bottom quarter.${thresholdCharts ? " On the threshold charts, the lighter band covers the middle 80%, leaving out the top and bottom tenth." : ""} They show how spread out each group's results are. Nothing is concluded from where yours fall.` }] : []),
    { title: "Why it varies", text: "The same person can get quite different numbers on different days. Screens, lighting, distance from the screen, tiredness and attention all change how a run goes, and a single run has some luck in it." },
  ];
}
