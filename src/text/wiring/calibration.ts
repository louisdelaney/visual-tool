// Steps 3 and 4: measuring the screen with a card, then the viewing distance, including the
// blind-spot check that runs full screen on the stage. Numbers arrive already formatted.
import { fill, type Md } from "../markdown";
import type { Words } from "../words";

export const calibration = (w: Words, md: Md) => {
  const { screen, distance, blindSpot } = w.calibration;
  const repeats = md.template("blindSpot.repeats");
  return {
    /** Step 3, the card. */
    screen: {
      ...screen,
      instructions: md("screen.instructions"),
      readout: (px: string, perMm: string, perInch: string) => fill(screen.readout, { px, perMm, perInch }),
      savedSize: md("screen.savedSize"),
      keepZoom: md("screen.keepZoom"),
    },
    /** Step 4, the viewing distance. */
    distance: {
      ...distance,
      intro: md("distance.intro"),
      windowNarrowFullScreen: md("distance.windowNarrowFullScreen"),
      windowNarrowNoFullScreen: md("distance.windowNarrowNoFullScreen"),
      tabletNote: md("distance.tabletNote"),
      byHand: (cm: string) => fill(distance.byHand, { cm }),
      fromBlindSpot: (cm: string, readings: number, lo: string, hi: string) => fill(distance.fromBlindSpot, { cm, readings, lo, hi }),
      /** Whether the tasks fit in this window at this distance. */
      fitSpan: (cm: string, wDeg: string, hDeg: string, needW: number, needH: number) => fill(distance.fitSpan, { cm, wDeg, hDeg, needW, needH }),
      fitsScaled: (pct: number, cm: number) => fill(distance.fitsScaled, { pct, cm }),
    },
    /** The blind-spot check, on the stage. Its messages are HTML: <strong> and <kbd> are fine here. */
    blindSpot: {
      ...blindSpot,
      steps: md.list("blindSpot.steps"),
      repeats: (n: number) => repeats({ times: n }),
      /** Along the top while a reading runs. */
      hud: (rep: number, of: number) => fill(blindSpot.hud, { rep, of }),
      missed: md("blindSpot.missed"),
      unlikely: (cm: string) => fill(blindSpot.unlikely, { cm }),
    },
  };
};
