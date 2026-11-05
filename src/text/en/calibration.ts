// Steps 3 and 4: measuring the screen with a card, then the viewing distance, including the
// blind-spot check that runs full screen. Its instructions are in calibration.md.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {cm}, {px} and the like are numbers the
// page fills in: keep them, and move them anywhere in the sentence. <strong> marks bold and
// <kbd> a key.

export const calibration = {
  // Step 3, the card.
  screen: {
    heading: "Measure your screen",
    // Printed on the outline, like the small print on a card.
    cardLabel: "ISO/IEC 7810 ID-1 · 85.60 × 53.98 mm",
    // For screen readers: the − and + buttons, and the slider between them.
    smaller: "Make the outline smaller",
    sliderLabel: "Card outline width",
    larger: "Make the outline larger",
    readout: "{px} px wide · {perMm} px per mm · {perInch} px per inch",
    matches: "The outline matches my card",
  },

  // Step 4, the viewing distance.
  distance: {
    heading: "Measure your viewing distance",
    startCheck: "Start blind-spot check",

    // The line saying what the distance is.
    notMeasured: "Not measured yet.",
    byHand: "Viewing distance: <strong>{cm} cm</strong>, entered by hand.",
    fromBlindSpot: "Viewing distance: <strong>{cm} cm</strong>, from {readings} blind-spot readings between {lo} and {hi} cm.",
    // Added after fromBlindSpot when the readings are far apart.
    readingsVary: "The readings vary a lot, so try the check again if you can.",

    manualLabel: "Or enter a distance you've measured, eye to screen",
    // The unit after the box.
    cm: "cm",
    useManual: "Use this distance",
    manualOutOfRange: "Enter a distance between 25 and 150 cm.",

    // Whether the tasks fit in this window at this distance.
    fitSpan: "At {cm} cm this window covers about {wDeg}° × {hDeg}° of your view, and the tasks need {needW}° × {needH}°.",
    // After fitSpan: one or the other.
    fitsFull: "They fit at full size.",
    fitsScaled: "They'll be shown at {pct}% of full size. For full size, go full screen, or sit at about {cm} cm and measure again.",

    next: "Continue to the tasks",
  },

  // The blind-spot check, on the test screen.
  blindSpot: {
    title: "Blind-spot check",
    // The intro's second button, and what Esc does there ("Esc to cancel").
    cancel: "Cancel",
    cancelVerb: "cancel",
    // Along the top while a reading runs.
    hud: "Reading {rep} of {of} · Space when the dot disappears · Esc to stop",
    // After a reading that didn't work: the second button, and what Esc does ("Esc to stop").
    stop: "Stop",
    stopVerb: "stop",
    noFit: "That reading doesn't fit the geometry.",
    unlikely: "That reading works out at {cm} cm, which is unlikely.",
    // After noFit or unlikely.
    pressOnce: "Press <kbd>Space</kbd> only once the dot has vanished completely.",
  },
};
