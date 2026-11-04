// Where you are in the test: four stages in words, with the current step named under its stage.
import type { View } from "../app/types";
import { TASK_LABEL, TASK_ORDER } from "../app/protocol";
import { text } from "../text";

const t = text.site.stepper;

const PHASES: { name: string; steps: [View, string][] }[] = [
  { name: t.beforeYouStart, steps: [["contribute", t.contribute], ["questions", t.questions], ["setup", t.setup]] },
  { name: t.calibration, steps: [["screen", t.screen], ["distance", t.distance]] },
  { name: t.tasks, steps: TASK_ORDER.map((task): [View, string] => [task, TASK_LABEL[task]]) },
  { name: t.results, steps: [["results", t.results]] },
];

export function Stepper({ view }: { view: View }) {
  const current = PHASES.findIndex(p => p.steps.some(([v]) => v === view));
  return (
    <ol className="stepper" aria-label={t.label}>
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
