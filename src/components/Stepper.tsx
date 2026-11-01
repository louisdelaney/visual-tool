// Where you are in the test: four stages in words, with the current step named under its stage.
import type { View } from "../app/types";
import { TASK_LABEL, TASK_ORDER } from "../app/protocol";

const PHASES: { name: string; steps: [View, string][] }[] = [
  { name: "Before you start", steps: [["contribute", "Contribute"], ["questions", "Questions"], ["setup", "Set up"]] },
  { name: "Calibration", steps: [["screen", "Screen size"], ["distance", "Viewing distance"]] },
  { name: "Tasks", steps: TASK_ORDER.map((t): [View, string] => [t, TASK_LABEL[t]]) },
  { name: "Results", steps: [["results", "Results"]] },
];

export function Stepper({ view }: { view: View }) {
  const current = PHASES.findIndex(p => p.steps.some(([v]) => v === view));
  return (
    <ol className="stepper" aria-label="Progress">
      {PHASES.map((phase, i) => {
        const step = i === current ? phase.steps.find(([v]) => v === view)?.[1] : undefined;
        return (
          <li key={phase.name} className={i < current ? "done" : ""} aria-current={i === current ? "step" : undefined}>
            <span className="phase">{phase.name}</span>
            {step && step !== phase.name && <span className="now">{step}</span>}
          </li>
        );
      })}
    </ol>
  );
}
