// The two tasks: the page before each one, then what shows on the full-screen test while it runs
// (the practice and test messages, feedback, the key reminder along the top, and the pause box).
// Its paragraphs are in tasks.md. Rewording these can change how people answer: see
// CONTRIBUTING.md.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {n}, {task} and the like are filled in by
// the page: keep them, and move them anywhere in the sentence. <kbd> marks a key.

export const tasks = {
  // The page before each task.
  intro: {
    // Above the task's name: before the first task, then once it's done ({task} is its name).
    eyebrow: "Task {n} of 2",
    eyebrowDone: "Task {n} of 2 · {task} done",
    // The example, for screen readers.
    previewLabel: { motion: "Example of the motion task", form: "Example of the form task" },
    // The list of keys: each key, then what it means.
    keys: {
      up: "dots drifting up",
      down: "dots drifting down",
      first: "starburst in the first flash",
      second: "starburst in the second flash",
    },
    // Between two keys that do the same thing.
    keyOr: "or",
    escPause: "<kbd>Esc</kbd> pause",
    startPractice: "Start practice ({trials} trials)",
  },

  // Before practice: the title. {task} is "Motion task" or "Form task".
  practiceTitle: "{task}: practice",
  startPractice: "Start practice",
  // What Esc does on the practice message ("Esc to go back").
  backVerb: "go back",

  // After each practice trial: "Correct", or "Not quite." and the right answer.
  correct: "Correct",
  notQuite: "Not quite. {answer}",
  answer: {
    up: "The dots were drifting up.",
    down: "The dots were drifting down.",
    first: "The starburst was in the first flash.",
    second: "The starburst was in the second flash.",
  },

  // After practice.
  practiceDone: "Practice done",
  startTest: "Start the test",
  practiseAgain: "Practise again",
  // What Esc does there ("Esc to practise again").
  practiseAgainVerb: "practise again",

  // Along the top while waiting for an answer. The wide gaps are two spaces each side.
  hud: {
    motion: "Up: ↑  ·  Down: ↓  ·  Pause: Esc",
    form: "First flash: 1 or ←  ·  Second flash: 2 or →  ·  Pause: Esc",
  },

  // Under the buttons of every message on the test screen: when Esc does nothing, and when it does
  // ({action} is one of the verbs above, like "go back").
  messageHint: "<kbd>Space</kbd> to continue",
  messageHintEsc: "<kbd>Space</kbd> to continue · <kbd>Esc</kbd> to {action}",

  // The box shown when a task is paused.
  pause: {
    heading: "Paused",
    resume: "Resume",
    end: "End and see results",
  },
};
