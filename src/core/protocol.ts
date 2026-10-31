// The test's parameters. There is one version and nothing is configurable, so results are
// comparable across people and computers. Everything is frozen: sessions export these objects
// as the record of how they were run.
//
// Motion: Pavan, Skujevskis & Baggio (2013). Form: Roccato, Campana, Vicovaro, Donato & Pavan
// (2024), dynamic spiral Glass patterns in two-interval forced choice. The 45° spiral angle is
// chosen here.

export interface RunLength {
  stopReversals: number;
  meanOfLast: number;
}

export interface StaircaseSpec {
  start: number;
  factor: number;
  /** Correct answers in a row needed to step down after the first error. */
  down: number;
  min: number;
  max: number;
  /** An easy 100% trial follows every this-many scored trials. */
  catchEvery: number;
  practiceTrials: number;
  maxTrials: number;
}

export interface MotionSpec {
  apertureDeg: number;
  dots: number;
  dotDeg: number;
  speed: number;
  lifetimeMs: number;
  fixationDeg: number;
  fixationMs: number;
  briefMs: number;
}

export interface FormSpec {
  radiusDeg: number;
  dipoles: number;
  dotDeg: number;
  separationDeg: number;
  spiralDeg: number;
  uniqueFrames: number;
  intervalMs: number;
  gapMs: number;
  fixationMs: number;
  fixationDeg: number;
}

/**
 * The version of the test itself. Any change to what participants see or do (timings, sizes,
 * dot counts, the staircase, instructions that could change answers) makes a different test:
 * bump this by one, and never pool results across versions. The unit tests pin these parameters
 * to this number, so changing one without bumping it fails; a change to the drawing or trial
 * code isn't caught that way, so bump it by hand.
 */
export const TEST_VERSION = 1;

export const PROTOCOL = Object.freeze({
  /** The area the stimuli need, in degrees. Smaller windows shrink them to fit; they're never enlarged. */
  field: Object.freeze({ w: 11, h: 11 }),
  motion: Object.freeze<MotionSpec>({ apertureDeg: 8, dots: 250, dotDeg: 0.03, speed: 20.1, lifetimeMs: 83.3, fixationDeg: 0.4, fixationMs: 1000, briefMs: 200 }),
  form: Object.freeze<FormSpec>({ radiusDeg: 5.35, dipoles: 2146, dotDeg: 0.04, separationDeg: 0.25, spiralDeg: 45, uniqueFrames: 12, intervalMs: 200, gapMs: 500, fixationMs: 1000, fixationDeg: 0.3 }),
  staircase: Object.freeze<StaircaseSpec>({ start: 100, factor: 0.84, down: 3, min: 1, max: 100, catchEvery: 8, practiceTrials: 4, maxTrials: 150 }),
  run: Object.freeze<RunLength>({ stopReversals: 10, meanOfLast: 8 }),
});

/** Screen size and viewing distance measurement (Li et al. 2020, virtual chinrest). */
export const CALIBRATION = Object.freeze({
  cardMm: Object.freeze({ w: 85.6, h: 53.98 }),
  blindSpotDeg: 13.5,
  blindSpotReps: 5,
  blindSpotSquareCm: 3,
  ipdCm: 6.3,
});

export type Protocol = typeof PROTOCOL;
