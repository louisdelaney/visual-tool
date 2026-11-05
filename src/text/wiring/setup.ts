// Step 2, the setup page: what the tasks look like, the full or quick test, and what you need.
import type { Md } from "../markdown";
import type { Words } from "../words";

export const setup = (w: Words, md: Md) => {
  const fullOption = md.template("fullOption");
  const quickOption = md.template("quickOption");
  const needRoom = md.template("needRoom");
  return {
    ...w.setup,
    motionCaption: md("motionCaption"),
    formCaption: md("formCaption"),
    previewsNote: md("previewsNote"),
    fullOption: (minutes: number) => fullOption({ minutes }),
    quickOption: (minutes: number) => quickOption({ minutes }),
    beforeYouStart: w.labels.beforeYouStart,
    needTabletStand: md("needTabletStand"),
    needComputer: md("needComputer"),
    needCard: md("needCard"),
    needRoom: (minutes: number) => needRoom({ minutes }),
    needGlasses: md("needGlasses"),
    pleaseRead: md("pleaseRead"),
  };
};
