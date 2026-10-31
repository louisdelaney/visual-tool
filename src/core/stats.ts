// Summary statistics, the psychometric function and the simulated observer.
import { PROTOCOL, type RunLength, type StaircaseSpec } from "./protocol";
import type { Rng } from "./random";
import { Staircase } from "./staircase";

export function median(values: readonly number[]): number | null {
  const v = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m]! : (v[m - 1]! + v[m]!) / 2;
}

export function mean(values: readonly number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

// 1 / threshold in %, the scale the clinic's own report uses: a 10% threshold is 0.1.
export function sensitivity(thresholdPct: number): number | null {
  return thresholdPct > 0 ? 1 / thresholdPct : null;
}

/** Proportion correct in two-alternative forced choice at coherence c (%), Weibull with lapses. */
export function weibull2afc(c: number, alpha: number, beta = 2, lapse = 0.02): number {
  return 0.5 + (0.5 - lapse) * (1 - Math.exp(-Math.pow(c / alpha, beta)));
}

export type SimulatedPhase = "test" | "catch";

export interface SimulatedTrial {
  phase: SimulatedPhase;
  level: number;
  correct: boolean;
  reversal: boolean;
}

export interface SimulateRunOptions {
  alpha: number;
  beta?: number;
  lapse?: number;
  rng: Rng;
  run: RunLength;
  staircase?: StaircaseSpec;
}

// Runs the procedure against a simulated observer (used by the tests).
export function simulateRun({ alpha, beta = 2, lapse = 0.02, rng, run, staircase = PROTOCOL.staircase }: SimulateRunOptions): { staircase: Staircase; trials: SimulatedTrial[] } {
  const sc = new Staircase({ start: staircase.start, factor: staircase.factor, down: staircase.down, min: staircase.min, max: staircase.max, maxTrials: staircase.maxTrials, ...run });
  const trials: SimulatedTrial[] = [];
  let sinceCatch = 0;
  while (!sc.done) {
    if (sinceCatch === staircase.catchEvery) {
      trials.push({ phase: "catch", level: 100, correct: rng() < weibull2afc(100, alpha, beta, lapse), reversal: false });
      sinceCatch = 0;
      continue;
    }
    const level = sc.level;
    const correct = rng() < weibull2afc(level, alpha, beta, lapse);
    const { reversal } = sc.record(correct);
    trials.push({ phase: "test", level, correct, reversal });
    sinceCatch += 1;
  }
  return { staircase: sc, trials };
}
