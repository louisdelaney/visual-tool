// Before each task: what you'll see, the keys, an example, and the start button.
import type { ReactNode } from "react";
import { PROTOCOL } from "../core";
import type { Session, TaskName } from "../app/types";
import { TASK_LABEL, TASK_ORDER } from "../app/protocol";
import { setState } from "../app/store";
import { backFromTask, startTask } from "../app/flow";
import { goFullscreen } from "../stage/fullscreen";
import { StimulusPreview } from "../components/StimulusPreview";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.tasks.intro;

interface Intro {
  copy: ReactNode;
  /** Keys, and what pressing them means. */
  keys: [string[], string][];
  caption: string;
}

const INTROS: Record<TaskName, Intro> = {
  motion: {
    copy: <>
      <p><Rich text={t.copy.motion[0]} /></p>
      <p><Rich text={t.copy.motion[1]} /></p>
    </>,
    keys: [[["↑"], t.keys.up], [["↓"], t.keys.down]],
    caption: t.caption.motion,
  },
  form: {
    copy: <>
      <p><Rich text={t.copy.form[0]} /></p>
      <p><Rich text={t.copy.form[1]} /></p>
    </>,
    keys: [[["1", "←"], t.keys.first], [["2", "→"], t.keys.second]],
    caption: t.caption.form,
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
    if (!(await goFullscreen())) setState({ flash: text.common.fullScreenUnavailable });
  };

  return (
    <section className="view panel" data-view="task" aria-labelledby="task-title">
      <p className="eyebrow" id="task-eyebrow">{t.eyebrow(i + 1, prevDone ? TASK_LABEL[first] : null)}</p>
      <h2 id="task-title">{TASK_LABEL[task]}</h2>
      <div id="task-copy" style={{ display: "grid", gap: 10 }}>{intro.copy}</div>
      <figure>
        <StimulusPreview key={task} kind={task} seed={task === "motion" ? 303 : 404} id={`task-canvas-${task}`} label={t.previewLabel[task]} />
        <figcaption><Rich text={intro.caption} /></figcaption>
      </figure>
      <ul className="keys" id="task-keys">
        {intro.keys.map(([keys, what]) => (
          <li key={what}>{keys.map((k, j) => <span key={k}>{j > 0 && t.keyOr}<kbd>{k}</kbd></span>)} {what}</li>
        ))}
        <li><Rich text={t.escPause} /></li>
      </ul>
      <div className="actions">
        <button type="button" className="btn" id="task-start" onClick={() => void startTask(task)}>{t.startPractice(PROTOCOL.staircase.practiceTrials)}</button>
        <button type="button" className="btn secondary" id="task-fs" onClick={() => void fullScreen()}>{text.common.goFullScreen}</button>
        <button type="button" className="btn secondary back" id="task-back" onClick={() => backFromTask(task)}>{text.common.back}</button>
      </div>
    </section>
  );
}
