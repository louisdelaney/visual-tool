// The two tasks: the page before each one, then what shows on the full-screen stage while it runs
// (the practice and test messages, feedback, the key reminder along the top, and the pause box).
// Stage messages are HTML: <strong>, <em> and <kbd> are fine in them.
import { fill, type Md } from "../markdown";
import type { Words } from "../words";

export const tasks = (w: Words, md: Md) => {
  const { intro: { eyebrow, eyebrowDone, ...intro }, messageHint, messageHintEsc, ...t } = w.tasks;
  const practiceIntro = md.template("practiceIntro");
  return {
    ...t,
    /** The page before each task. */
    intro: {
      ...intro,
      /** Above the task's name; doneTask is the first task's name once it's done. */
      eyebrow: (n: number, doneTask: string | null) => (doneTask ? fill(eyebrowDone, { n, task: doneTask }) : fill(eyebrow, { n })),
      /** Two paragraphs per task. */
      copy: { motion: md.paragraphs("intro.copy.motion"), form: md.paragraphs("intro.copy.form") },
      caption: { motion: md("intro.caption.motion"), form: md("intro.caption.form") },
      /** Between two keys that do the same thing, so it has a space each side. */
      keyOr: ` ${intro.keyOr} `,
      startPractice: (trials: number) => fill(intro.startPractice, { trials }),
    },
    /** Before practice: the title, then the paragraphs. */
    practiceTitle: (task: string) => fill(t.practiceTitle, { task }),
    practiceIntro: (trials: number) => practiceIntro({ trials }),
    /** What to look for, shown before and after practice. */
    recap: { motion: md("recap.motion"), form: md("recap.form") },
    /** How to answer, after the recap. */
    how: { motion: md("how.motion"), form: md("how.form") },
    /** After "how", before practice only. */
    guess: { motion: md("guess.motion"), form: md("guess.form") },
    /** After a practice trial answered wrongly: "Not quite." and the right answer. */
    notQuite: (answer: string) => fill(t.notQuite, { answer }),
    nowTheTest: md("nowTheTest"),
    practiseAgainPrompt: md("practiseAgainPrompt"),
    /** Under the buttons of every stage message. escAction is what Esc does, if anything. */
    messageHint: (escAction: string | null) => (escAction ? fill(messageHintEsc, { action: escAction }) : messageHint),
    /** The box shown when a task is paused. */
    pause: { ...t.pause, body: md("pause.body") },
  };
};
