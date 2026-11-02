// The test's parameters. There are two fixed types of test, full and quick, and nothing else is
// configurable, so results are comparable across people and computers. Everything is frozen:
// sessions export these objects as the record of how they were run.
//
// Motion: Pavan, Skujevskis & Baggio (2013). Form: Roccato, Campana, Vicovaro, Donato & Pavan
// (2024), dynamic Glass patterns in two-interval forced choice, their radial condition. The full
// run stops as Pavan's did, at 16 reversals averaging the last 12, which is within the length
// Alcalá-Quintana & García-Pérez (2007) recommend for a 1-up/3-down staircase.
//
// The quick test is a separate type of test with the same stimuli and staircase steps: it stops
// at 8 reversals and averages the last 6, still discarding the first two, which sit high while the
// staircase finds its level, and its easy check trial comes after every 16th trial instead of every
// 8th. Simulated observers take about 48 trials a task against the full test's 90 (53%), with a
// threshold that varies about ×1.26–1.40 from run to run against ×1.18–1.19. That's shorter than
// any published recommendation for this staircase. Quick and full results are never pooled.

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
  /** Signal dipoles' angle to the radius: 0 radial (the test), 90 concentric, a spiral in between. */
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
export const TEST_VERSION = 2;

export const PROTOCOL = Object.freeze({
  /** The area the stimuli need, in degrees. Smaller windows shrink them to fit; they're never enlarged. */
  field: Object.freeze({ w: 11, h: 11 }),
  motion: Object.freeze<MotionSpec>({ apertureDeg: 8, dots: 250, dotDeg: 0.03, speed: 20.1, lifetimeMs: 83.3, fixationDeg: 0.4, fixationMs: 1000, briefMs: 200 }),
  form: Object.freeze<FormSpec>({ radiusDeg: 5.35, dipoles: 2146, dotDeg: 0.04, separationDeg: 0.25, spiralDeg: 0, uniqueFrames: 12, intervalMs: 200, gapMs: 500, fixationMs: 1000, fixationDeg: 0.3 }),
  staircase: Object.freeze<StaircaseSpec>({ start: 100, factor: 0.84, down: 3, min: 1, max: 100, catchEvery: 8, practiceTrials: 4, maxTrials: 150 }),
  run: Object.freeze<RunLength>({ stopReversals: 16, meanOfLast: 12 }),
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

/** The two types of test. Every session records which it ran. */
export type TestType = "full" | "quick";

export const TEST_TYPES: readonly TestType[] = ["full", "quick"];

/** The quick test: the full test's stimuli and staircase steps, a shorter run and fewer check trials. */
export const QUICK_PROTOCOL: Protocol = Object.freeze({
  ...PROTOCOL,
  staircase: Object.freeze<StaircaseSpec>({ ...PROTOCOL.staircase, catchEvery: 16, maxTrials: 80 }),
  run: Object.freeze<RunLength>({ stopReversals: 8, meanOfLast: 6 }),
});

export const PROTOCOLS: Readonly<Record<TestType, Protocol>> = Object.freeze({ full: PROTOCOL, quick: QUICK_PROTOCOL });
