// 1-down until the first error, then N-down/1-up with multiplicative steps. N = 2 converges on
// 70.7% correct; N = 3, which the test uses, on 79.4%.

export interface StaircaseOptions {
  start: number;
  factor: number;
  down: number;
  min: number;
  max: number;
  stopReversals: number;
  meanOfLast: number;
  maxTrials: number;
}

export interface Reversal {
  /** Index into history of the trial where the direction changed. */
  index: number;
  level: number;
}

export interface StaircaseStep {
  level: number;
  correct: boolean;
  reversal: boolean;
}

export interface RecordResult {
  level: number;
  reversal: boolean;
  next: number;
}

const DEFAULTS: StaircaseOptions = { start: 100, factor: 0.84, down: 2, min: 1, max: 100, stopReversals: 6, meanOfLast: 4, maxTrials: 100 };

export class Staircase {
  readonly opts: StaircaseOptions;
  level: number;
  /** True until the first error, while every correct answer steps down. */
  initial = true;
  streak = 0;
  lastStep = 0;
  readonly reversals: Reversal[] = [];
  readonly history: StaircaseStep[] = [];

  constructor(opts: Partial<StaircaseOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    if (!(this.opts.down >= 1)) this.opts.down = 2;
    this.level = this.opts.start;
  }

  get done(): boolean {
    return this.reversals.length >= this.opts.stopReversals || this.history.length >= this.opts.maxTrials;
  }

  /** Mean level of the last meanOfLast reversals, or null before the first. */
  get threshold(): number | null {
    const r = this.reversals.slice(-this.opts.meanOfLast);
    return r.length ? r.reduce((s, v) => s + v.level, 0) / r.length : null;
  }

  record(correct: boolean): RecordResult {
    const level = this.level;
    let step = 0;
    if (this.initial) {
      if (correct) step = -1;
      else { this.initial = false; step = 1; }
    } else if (correct) {
      this.streak += 1;
      if (this.streak >= this.opts.down) { this.streak = 0; step = -1; }
    } else {
      this.streak = 0;
      step = 1;
    }
    let reversal = false;
    if (step !== 0) {
      if (this.lastStep !== 0 && step !== this.lastStep) {
        reversal = true;
        this.reversals.push({ index: this.history.length, level });
      }
      this.lastStep = step;
      const next = step < 0 ? level * this.opts.factor : level / this.opts.factor;
      this.level = Math.min(this.opts.max, Math.max(this.opts.min, next));
    }
    this.history.push({ level, correct: !!correct, reversal });
    return { level, reversal, next: this.level };
  }
}
