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
      <p>You'll see a square of dots. Some drift together, either up or down; the rest jump about at random. Say which way the drifting dots are going.</p>
      <p>The dots appear for only a fifth of a second, then you answer. Keep your eyes on the red spot in the middle so you don't miss them. If you can't tell, guess: the test adapts to you.</p>
    </>,
    keys: [[["↑"], "drifting up"], [["↓"], "drifting down"]],
    caption: "Example at 100% coherence, drifting up.",
  },
  form: {
    copy: <>
      <p>Each trial shows two quick flashes of flickering dots, one after the other. In one flash, some of the dots line up into a starburst, pointing out from the centre; the other flash is random. Say which flash had the starburst.</p>
      <p>Keep your eyes on the grey spot in the middle. If you can't tell, guess: the test adapts to you.</p>
    </>,
    keys: [[["1", "←"], "first flash"], [["2", "→"], "second flash"]],
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
