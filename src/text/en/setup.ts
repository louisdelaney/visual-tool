// Step 2, the setup page: what the tasks look like, the full or quick test, and what you need.
// Its paragraphs are in setup.md.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is.

export const setup = {
  heading: "What you'll see",
  // The animated examples, for screen readers.
  motionPreviewLabel: "Animated example of the motion task",
  formPreviewLabel: "Example of the form task",
  // The button after the motion caption that stops and starts both examples.
  pause: "Pause",
  play: "Play",

  testTypeQuestion: "Full or quick test",
  // Under the choice once a task has run, by the test type that was started.
  locked: {
    full: "You've started the full test, so this stays as it is until you start again.",
    quick: "You've started the quick test, so this stays as it is until you start again.",
  },

  // Above Start when the window is too narrow for the tasks.
  tooNarrowTablet: "The screen is too narrow this way round. Turn the tablet sideways to start.",
  tooNarrow: "This window is too narrow to run the tasks. Make it wider or maximise it to start.",
};
