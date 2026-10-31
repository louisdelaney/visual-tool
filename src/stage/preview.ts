// Small animated examples of each task, drawn with the same code as the stage. One animation
// loop drives every preview on the page; it pauses while the stage is open so the examples never
// compete with a real trial for frames.
import { Core, PROTOCOL } from "../core";
import type { TaskName } from "../app/types";
import { dpr } from "../app/protocol";
import { reduceMotion } from "./dom";
import { drawGlass, drawUpDown, type Geom } from "./drawing";
import { getStage } from "./stage";

export class Preview {
  playing = !reduceMotion;
  private readonly ctx: CanvasRenderingContext2D;
  private paint: (() => void) | null = null;
  private step: ((dt: number) => void) | null = null;

  constructor(readonly canvas: HTMLCanvasElement, readonly kind: TaskName, readonly seed: number) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D isn't available");
    this.ctx = ctx;
  }

  /** Builds the stimulus at the canvas's current size, at 100% coherence, and draws it. */
  build(): void {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const ratio = dpr();
    this.canvas.width = Math.round(r.width * ratio);
    this.canvas.height = Math.round(r.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const field = PROTOCOL.field;
    const g: Geom = { w: r.width, h: r.height, cx: r.width / 2, cy: r.height / 2, ppd: Math.min(r.width / (field.w + 1), r.height / (field.h + 1)) };
    const rng = Core.mulberry32(this.seed);
    const ctx = this.ctx;
    if (this.kind === "motion") {
      const stim = new Core.UpDownMotion({ rng, coherence: 1, direction: -1, ...PROTOCOL.motion });
      this.step = dt => stim.step(dt);
      this.paint = () => drawUpDown(ctx, stim, g);
    } else {
      const F = PROTOCOL.form, n = F.uniqueFrames;
      const frames = Array.from({ length: n }, () => Core.glassFrame({ rng, coherence: 1, ...F, handed: 1 }));
      let t = 0;
      this.step = dt => { t += dt; };
      this.paint = () => drawGlass(ctx, frames[Math.floor(t / (F.intervalMs / n)) % n], g);
    }
    this.paint();
  }

  tick(dt: number): void {
    if (!this.step || !this.playing || !this.paint) return;
    this.step(dt);
    this.paint();
  }
}

const active = new Set<Preview>();
let last: number | null = null;
let running = false;

function loop(ts: number): void {
  const dt = last == null ? 0 : Math.min(50, ts - last);
  last = ts;
  if (!getStage().open) for (const p of active) p.tick(dt);
  requestAnimationFrame(loop);
}

/** Adds a preview to the shared animation loop; returns a function that removes it. */
export function animate(preview: Preview): () => void {
  active.add(preview);
  if (!running) { running = true; requestAnimationFrame(loop); }
  return () => { active.delete(preview); };
}
