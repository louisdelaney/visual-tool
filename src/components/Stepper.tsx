// The numbered list of steps under the title, with the current one highlighted.
import type { View } from "../app/types";
import { TASK_LABEL, TASK_ORDER } from "../app/protocol";

const STEPS: [View, string][] = [
  ["contribute", "Contribute"],
  ["setup", "Set up"],
  ["screen", "Screen size"],
  ["distance", "Viewing distance"],
  ...TASK_ORDER.map((t): [View, string] => [t, TASK_LABEL[t]]),
  ["results", "Results"],
];

export function Stepper({ view }: { view: View }) {
  const current = STEPS.findIndex(([v]) => v === view);
  return (
    <ol className="stepper" aria-label="Stages">
      {STEPS.map(([v, label], i) => {
        const done = i < current;
        return (
          <li key={v} className={done ? "done" : ""} aria-current={i === current ? "step" : undefined}>
            <span className="n" aria-hidden="true">{done ? "✓" : i + 1}</span>
            <span className="label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
