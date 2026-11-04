// The two tasks: the page before each one, then what shows on the full-screen stage while it runs
// (the practice and test messages, feedback, the key reminder along the top, and the pause box).
// The paragraphs are in tasks.md. Stage messages are HTML: <strong>, <em> and <kbd> are fine in them.
import source from "./tasks.md";
import { markdown } from "../markdown";

const md = markdown(source, "tasks.md");
const practiceIntro = md.template("practiceIntro");

export const tasks = {
  /** The page before each task. */
  intro: {
    /** Above the task's name; doneTask is the first task's name once it's done. */
    eyebrow: (n: number, doneTask: string | null) => `Task ${n} of 2${doneTask ? ` · ${doneTask} done` : ""}`,
    /** Two paragraphs per task. */
    copy: {
      motion: md.paragraphs("intro.copy.motion"),
      form: md.paragraphs("intro.copy.form"),
    },
    /** The example, for screen readers. */
    previewLabel: { motion: "Example of the motion task", form: "Example of the form task" },
    caption: {
      motion: md("intro.caption.motion"),
      form: md("intro.caption.form"),
    },
    /** The list of keys: each key (or keys, joined by keyOr), then what it means. */
    keys: {
      up: "dots drifting up",
      down: "dots drifting down",
      first: "starburst in the first flash",
      second: "starburst in the second flash",
    },
    /** Between two keys that do the same thing. Keep the spaces. */
    keyOr: " or ",
    escPause: "<kbd>Esc</kbd> pause",
    startPractice: (trials: number) => `Start practice (${trials} trials)`,
  },

  /** Before practice: the title, then the paragraphs. */
  practiceTitle: (task: string) => `${task}: practice`,
  practiceIntro: (trials: number) => practiceIntro({ trials }),
  /** What to look for, shown before and after practice. */
  recap: {
    motion: md("recap.motion"),
    form: md("recap.form"),
  },
  /** How to answer, after the recap. */
  how: {
    motion: md("how.motion"),
    form: md("how.form"),
  },
  /** After "how", before practice only. */
  guess: {
    motion: md("guess.motion"),
    form: md("guess.form"),
  },
  startPractice: "Start practice",
  /** What Esc does on the practice message ("Esc to go back"). */
  backVerb: "go back",

  /** After each practice trial: "Correct", or "Not quite." and the right answer. */
  correct: "Correct",
  notQuite: (answer: string) => `Not quite. ${answer}`,
  answer: {
    up: "The dots were drifting up.",
    down: "The dots were drifting down.",
    first: "The starburst was in the first flash.",
    second: "The starburst was in the second flash.",
  },

  /** After practice: the title, then recap and how in one paragraph, then these. */
  practiceDone: "Practice done",
  nowTheTest: md("nowTheTest"),
  practiseAgainPrompt: md("practiseAgainPrompt"),
  startTest: "Start the test",
  practiseAgain: "Practise again",
  /** What Esc does there ("Esc to practise again"). */
  practiseAgainVerb: "practise again",

  /** Along the top while waiting for an answer. Plain text, not HTML; the wide gaps are two spaces each side. */
  hud: {
    motion: "Up: ↑  ·  Down: ↓  ·  Pause: Esc",
    form: "First flash: 1 or ←  ·  Second flash: 2 or →  ·  Pause: Esc",
  },

  /** Under the buttons of every stage message. escAction is what Esc does, if anything. */
  messageHint: (escAction: string | null) => (escAction ? `<kbd>Space</kbd> to continue · <kbd>Esc</kbd> to ${escAction}` : "<kbd>Space</kbd> to continue"),

  /** The box shown when a task is paused. */
  pause: {
    heading: "Paused",
    body: md("pause.body"),
    resume: "Resume",
    end: "End and see results",
  },
};
