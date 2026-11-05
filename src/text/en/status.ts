// Messages from moving between steps: the one-line notes above a page, the "are you sure?" boxes,
// and the note on the stage while it gets ready.

export const status = {
  /** Asked before going home from the results, which clears them. */
  leaveResults: "Leave your results and start again? Save them first if you want a copy.",
  /** Asked before following the link to another language once a test is under way: that's a new page, so it starts again. */
  changeLanguage: "Change language? The page reloads, so the test starts again and any results you haven't saved are lost.",
  /** Asked before going back from the second task to redo the first, by the task to redo. */
  redoTask: {
    motion: "Go back and redo the motion task? Your motion results so far will be replaced.",
    form: "Go back and redo the form task? Your form results so far will be replaced.",
  },
  /** Above the card page when the zoom or screen has changed since the card was measured. */
  screenChanged: "Your browser zoom or screen has changed since you measured the card. Measure it again.",
  /** On the stage while the display's frame rate is measured, before the first task. */
  gettingReady: "Getting ready…",
  /** Above the task's page when it couldn't run. */
  taskFailed: "Something went wrong while running the task. Try starting it again.",
};
