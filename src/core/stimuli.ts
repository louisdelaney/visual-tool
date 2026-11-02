// The dot fields drawn in each task. Positions are in degrees of visual angle; nothing here
// touches the DOM, so the tests can build and inspect stimuli directly.
import { shuffle, type Rng } from "./random";
import type { FormSpec, MotionSpec } from "./protocol";

const DEG = Math.PI / 180;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// ----- Motion: dots drifting up or down -----

export interface UpDownDot {
  x: number;
  y: number;
  age: number;
  signal: boolean;
}

/** -1 up, +1 down. */
export type VerticalDirection = -1 | 1;

export type UpDownMotionOptions = { rng: Rng; coherence: number; direction: VerticalDirection } & Pick<MotionSpec, "apertureDeg" | "dots" | "speed" | "lifetimeMs">;

// Pavan et al. (2013): signal dots translate up or down inside a square aperture; noise dots are
// replotted at random every frame; every dot lives 83.3 ms, with staggered starting ages.
// Positions are degrees from the aperture centre, y down.
export class UpDownMotion {
  readonly rng: Rng;
  readonly size: number;
  readonly speed: number;
  readonly lifetimeMs: number;
  readonly direction: VerticalDirection;
  readonly nSignal: number;
  readonly dots: UpDownDot[];

  constructor({ rng, coherence, direction, apertureDeg, dots, speed, lifetimeMs }: UpDownMotionOptions) {
    this.rng = rng; this.size = apertureDeg; this.speed = speed; this.lifetimeMs = lifetimeMs; this.direction = direction;
    const order = shuffle(Array.from({ length: dots }, (_, i) => i), rng);
    this.nSignal = Math.round(clamp01(coherence) * dots);
    const isSignal = new Uint8Array(dots);
    for (let k = 0; k < this.nSignal; k++) isSignal[order[k]!] = 1;
    this.dots = Array.from({ length: dots }, (_, i) => ({ x: (rng() - 0.5) * apertureDeg, y: (rng() - 0.5) * apertureDeg, age: rng() * lifetimeMs, signal: isSignal[i] === 1 }));
  }

  /** Advances dtMs; returns how many dots reached the end of their life and were replotted. */
  step(dtMs: number): number {
    const size = this.size, half = size / 2, dist = this.speed * dtMs / 1000;
    let replotted = 0;
    for (const d of this.dots) {
      d.age += dtMs;
      if (d.age >= this.lifetimeMs) {
        d.age %= this.lifetimeMs;
        d.x = (this.rng() - 0.5) * size; d.y = (this.rng() - 0.5) * size;
        replotted += 1;
      } else if (d.signal) {
        d.y += this.direction * dist;
        if (d.y < -half) d.y += size; else if (d.y >= half) d.y -= size;
      } else {
        d.x = (this.rng() - 0.5) * size; d.y = (this.rng() - 0.5) * size;
      }
    }
    return replotted;
  }
}

// ----- Form: Glass patterns -----

export interface GlassFrame {
  /** Dot coordinates in degrees, y down: [x1, y1, x2, y2, ...], two dots per dipole. */
  pts: Float32Array;
  dipoles: number;
  nSignal: number;
}

export type GlassFrameOptions = { rng: Rng; coherence: number; handed?: 1 | -1 } & Pick<FormSpec, "radiusDeg" | "dipoles" | "separationDeg" | "spiralDeg">;

// One frame of a Glass pattern in a disc. Dipole centres are uniform over the disc; signal
// dipoles lie at spiralDeg to the radius (0 radial, 90 concentric; handed ±1 sets the turn),
// noise dipoles point anywhere.
export function glassFrame({ rng, coherence, radiusDeg, dipoles, separationDeg, spiralDeg, handed = 1 }: GlassFrameOptions): GlassFrame {
  const nSignal = Math.round(clamp01(coherence) * dipoles);
  const rMax = radiusDeg - separationDeg / 2, h = separationDeg / 2, sp = handed * spiralDeg * DEG;
  const pts = new Float32Array(dipoles * 4);
  for (let i = 0; i < dipoles; i++) {
    const r = rMax * Math.sqrt(rng()), a = rng() * 2 * Math.PI;
    const x = r * Math.cos(a), y = r * Math.sin(a);
    const theta = i < nSignal ? a + sp : rng() * Math.PI;
    const dx = Math.cos(theta) * h, dy = Math.sin(theta) * h;
    pts[i * 4] = x - dx; pts[i * 4 + 1] = y - dy; pts[i * 4 + 2] = x + dx; pts[i * 4 + 3] = y + dy;
  }
  return { pts, dipoles, nSignal };
}
