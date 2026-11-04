// Steps 3 and 4: measuring the screen with a card, then the viewing distance, including the
// blind-spot check that runs full screen on the stage. The instructions are in calibration.md.
import source from "./calibration.md";
import { markdown } from "../markdown";

const md = markdown(source, "calibration.md");
const repeats = md.template("blindSpot.repeats");

export const calibration = {
  /** Step 3, the card. */
  screen: {
    heading: "Measure your screen",
    instructions: md("screen.instructions"),
    /** Printed on the outline, like the small print on a card. */
    cardLabel: "ISO/IEC 7810 ID-1 · 85.60 × 53.98 mm",
    /** For screen readers: the − and + buttons, and the slider between them. */
    smaller: "Make the outline smaller",
    sliderLabel: "Card outline width",
    larger: "Make the outline larger",
    /** Numbers come formatted. */
    readout: (px: string, perMm: string, perInch: string) => `${px} px wide · ${perMm} px per mm · ${perInch} px per inch`,
    savedSize: md("screen.savedSize"),
    keepZoom: md("screen.keepZoom"),
    matches: "The outline matches my card",
  },

  /** Step 4, the viewing distance. */
  distance: {
    heading: "Measure your viewing distance",
    intro: md("distance.intro"),
    windowNarrowFullScreen: md("distance.windowNarrowFullScreen"),
    windowNarrowNoFullScreen: md("distance.windowNarrowNoFullScreen"),
    startCheck: "Start blind-spot check",
    tabletNote: md("distance.tabletNote"),

    // The line saying what the distance is. Numbers come formatted.
    notMeasured: "Not measured yet.",
    byHand: (cm: string) => `Viewing distance: <strong>${cm} cm</strong>, entered by hand.`,
    fromBlindSpot: (cm: string, readings: number, lo: string, hi: string) => `Viewing distance: <strong>${cm} cm</strong>, from ${readings} blind-spot readings between ${lo} and ${hi} cm.`,
    /** Added after fromBlindSpot when the readings are far apart. */
    readingsVary: "The readings vary a lot, so try the check again if you can.",

    manualLabel: "Or enter a distance you've measured, eye to screen",
    /** The unit after the box. */
    cm: "cm",
    useManual: "Use this distance",
    manualOutOfRange: "Enter a distance between 25 and 150 cm.",

    // Whether the tasks fit in this window at this distance. Numbers come formatted.
    fitSpan: (cm: string, wDeg: string, hDeg: string, needW: number, needH: number) => `At ${cm} cm this window covers about ${wDeg}° × ${hDeg}° of your view, and the tasks need ${needW}° × ${needH}°.`,
    /** After fitSpan. */
    fitsFull: "They fit at full size.",
    fitsScaled: (pct: number, cm: number) => `They'll be shown at ${pct}% of full size. For full size, go full screen, or sit at about ${cm} cm and measure again.`,

    next: "Continue to the tasks",
  },

  /** The blind-spot check, on the stage. Its messages are HTML: <strong> and <kbd> are fine here. */
  blindSpot: {
    title: "Blind-spot check",
    steps: md.list("blindSpot.steps"),
    repeats: (n: number) => repeats({ times: n }),
    /** The intro's second button, and what Esc does there ("Esc to cancel"). */
    cancel: "Cancel",
    cancelVerb: "cancel",
    /** Along the top while a reading runs. */
    hud: (rep: number, of: number) => `Reading ${rep} of ${of} · Space when the dot disappears · Esc to stop`,
    /** After a reading that didn't work: the second button, and what Esc does ("Esc to stop"). */
    stop: "Stop",
    stopVerb: "stop",
    missed: md("blindSpot.missed"),
    noFit: "That reading doesn't fit the geometry.",
    unlikely: (cm: string) => `That reading works out at ${cm} cm, which is unlikely.`,
    /** After noFit or unlikely. */
    pressOnce: "Press <kbd>Space</kbd> only once the dot has vanished completely.",
  },
};
