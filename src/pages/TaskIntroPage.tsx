// Before each task: what you'll see, the keys, an example, and the start button.
import type { ReactNode } from "react";
import { PROTOCOL } from "../core";
import type { Session, TaskName } from "../app/types";
import { TASK_LABEL, TASK_ORDER } from "../app/protocol";
import { setState } from "../app/store";
import { backFromTask, startTask } from "../app/flow";
import { goFullscreen } from "../stage/fullscreen";
import { StimulusPreview } from "../components/StimulusPreview";

interface Intro {
  copy: ReactNode;
  /** Keys, and what pressing them means. */
  keys: [string[], string][];
  caption: string;
}

const INTROS: Record<TaskName, Intro> = {
  motion: {
    copy: <>
      <p>You'll see a square of dots for a fifth of a second. Some drift together, either up or down; the rest jump about at random. Your job is to say which way the drifting dots went. Keep your eyes on the red spot in the middle so you don't miss them.</p>
      <p>When the dots disappear, press <kbd>↑</kbd> if they drifted up or <kbd>↓</kbd> if they drifted down. You can also click the top or bottom half of the screen. If you can't tell, guess up or down anyway: the test adapts to you.</p>
    </>,
    keys: [[["↑"], "dots drifting up"], [["↓"], "dots drifting down"]],
    caption: "Example at 100% coherence, drifting up.",
  },
  form: {
    copy: <>
      <p>Each trial shows two quick flashes of flickering dots, one after the other. In one flash, some of the dots line up into a starburst, pointing out from the centre; the other flash is random. Your job is to say which flash had the starburst. Keep your eyes on the grey spot in the middle.</p>
      <p>After the second flash, press <kbd>1</kbd> or <kbd>←</kbd> if the starburst was in the first flash, or <kbd>2</kbd> or <kbd>→</kbd> if it was in the second. You can also click the left or right half of the screen. If you can't tell, guess 1 or 2 anyway: the test adapts to you.</p>
    </>,
    keys: [[["1", "←"], "starburst in the first flash"], [["2", "→"], "starburst in the second flash"]],
    caption: "Example at 100% coherence: the starburst, flickering as it will in the test.",
  },
};

interface TaskIntroPageProps {
  task: TaskName;
  session: Session | null;
}

export function TaskIntroPage({ task, session }: TaskIntroPageProps) {
  const i = TASK_ORDER.indexOf(task);
  const first = TASK_ORDER[0];
  const prevDone = i > 0 && !!session?.tasks[first];
  const intro = INTROS[task];
  const fullScreen = async (): Promise<void> => {
    if (!(await goFullscreen())) setState({ flash: "Full screen isn't available here. Maximise the browser window instead." });
  };

  return (
    <section className="view panel" data-view="task" aria-labelledby="task-title">
      <p className="eyebrow" id="task-eyebrow">{`Task ${i + 1} of 2${prevDone ? ` · ${TASK_LABEL[first]} done` : ""}`}</p>
      <h2 id="task-title">{TASK_LABEL[task]}</h2>
      <div id="task-copy" style={{ display: "grid", gap: 10 }}>{intro.copy}</div>
      <figure>
        <StimulusPreview key={task} kind={task} seed={task === "motion" ? 303 : 404} id={`task-canvas-${task}`} label={`Example of the ${task} task`} />
        <figcaption>{intro.caption}</figcaption>
      </figure>
      <ul className="keys" id="task-keys">
        {intro.keys.map(([keys, what]) => (
          <li key={what}>{keys.map((k, j) => <span key={k}>{j > 0 && " or "}<kbd>{k}</kbd></span>)} {what}</li>
        ))}
        <li><kbd>Esc</kbd> pause</li>
      </ul>
      <div className="actions">
        <button type="button" className="btn" id="task-start" onClick={() => void startTask(task)}>{`Start practice (${PROTOCOL.staircase.practiceTrials} trials)`}</button>
        <button type="button" className="btn secondary" id="task-fs" onClick={() => void fullScreen()}>Go full screen</button>
        <button type="button" className="btn secondary back" id="task-back" onClick={() => backFromTask(task)}>Back</button>
      </div>
    </section>
  );
}
