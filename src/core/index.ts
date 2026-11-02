// The core: protocol, randomness, staircase, stimuli and geometry. No DOM, so it all runs in
// Node for the unit tests.
//
// The app reaches these through the Core object rather than importing them directly. The
// end-to-end tests replace some of its members at runtime (window.Core) to record each trial's
// target and coherence, which only works if calls go through this object.
import { CALIBRATION, PROTOCOL, TEST_VERSION } from "./protocol";
import { mixSeed, mulberry32, shuffle } from "./random";
import { Staircase } from "./staircase";
import { glassFrame, UpDownMotion } from "./stimuli";
import { angularExtentDeg, distanceFromBlindSpot, distanceFromBlindSpotGeometry, fitScale, pxPerDeg } from "./geometry";
import { geometricMean, mean, median, sensitivity, simulateRun, weibull2afc } from "./stats";
import { toCSV } from "./csv";

export * from "./protocol";
export * from "./random";
export * from "./staircase";
export * from "./stimuli";
export * from "./geometry";
export * from "./stats";
export * from "./csv";

export const Core = {
  TEST_VERSION, PROTOCOL, CALIBRATION,
  mulberry32, mixSeed, shuffle,
  Staircase,
  UpDownMotion, glassFrame,
  weibull2afc, simulateRun,
  pxPerDeg, distanceFromBlindSpot, distanceFromBlindSpotGeometry, angularExtentDeg, fitScale,
  median, mean, geometricMean, sensitivity,
  toCSV,
};

export type CoreApi = typeof Core;
