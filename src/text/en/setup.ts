// Step 2, the setup page: what the tasks look like, the full or quick test, and what you need.
// The paragraphs are in setup.md.
import source from "./setup.md";
import { markdown } from "../markdown";

const md = markdown(source, "setup.md");
const fullOption = md.template("fullOption");
const quickOption = md.template("quickOption");
const needRoom = md.template("needRoom");

export const setup = {
  heading: "What you'll see",
  /** The animated examples, for screen readers. */
  motionPreviewLabel: "Animated example of the motion task",
  formPreviewLabel: "Example of the form task",
  motionCaption: md("motionCaption"),
  /** The button after the motion caption that stops and starts both examples. */
  pause: "Pause",
  play: "Play",
  formCaption: md("formCaption"),
  previewsNote: md("previewsNote"),

  testTypeQuestion: "Full or quick test",
  fullOption: (minutes: number) => fullOption({ minutes }),
  quickOption: (minutes: number) => quickOption({ minutes }),
  /** Under the choice once a task has run, by the test type that was started. */
  locked: {
    full: "You've started the full test, so this stays as it is until you start again.",
    quick: "You've started the quick test, so this stays as it is until you start again.",
  },

  beforeYouStart: "Before you start",
  needTabletStand: md("needTabletStand"),
  needComputer: md("needComputer"),
  needCard: md("needCard"),
  needRoom: (minutes: number) => needRoom({ minutes }),
  needGlasses: md("needGlasses"),
  pleaseRead: md("pleaseRead"),
  /** Above Start when the window is too narrow for the tasks. */
  tooNarrowTablet: "The screen is too narrow this way round. Turn the tablet sideways to start.",
  tooNarrow: "This window is too narrow to run the tasks. Make it wider or maximise it to start.",
};
