// What each number on the results pages measures, in plain terms: shared by the pages' "What the
// numbers mean" and the PDF summaries. It describes the measures, never the person: nothing here
// ranks a result or reads anything into where it falls. The words are in src/text (charts.explained).
import { text } from "../text";

const t = text.charts.explained;

export const EXPLAIN_LEAD = t.lead;

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
    t.threshold,
    t.motionAndForm,
    t.sensitivity,
    t.diff,
    ...(groups ? [{ title: t.groupBars.title, text: t.groupBars.text(thresholdCharts) }] : []),
    t.varies,
  ];
}
