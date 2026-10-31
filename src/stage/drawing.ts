// Draws each kind of stimulus onto a 2D canvas. Shared by the full-screen stage and the small
// previews on the pages, so both show exactly the same thing.
import { PROTOCOL, type GlassFrame, type UpDownMotion } from "../core";
import { dpr } from "../app/protocol";

/** Where to draw: canvas size in CSS pixels, its centre, and pixels per degree. */
export interface Geom {
  w: number;
  h: number;
  cx: number;
  cy: number;
  ppd: number;
}

export const FIX_RED = "#E0302A";
export const FIX_GREY = "#808080";

// Square dots at least one CSS pixel, snapped to device pixels so they stay crisp.
function dotPainter(ctx: CanvasRenderingContext2D, g: Geom, dotDeg: number): (x: number, y: number) => void {
  const ratio = dpr(), size = Math.max(1, Math.round(dotDeg * g.ppd * ratio)) / ratio;
  const snap = (v: number): number => Math.round(v * ratio) / ratio;
  return (x, y) => ctx.rect(snap(g.cx + x * g.ppd - size / 2), snap(g.cy + y * g.ppd - size / 2), size, size);
}

function drawSpot(ctx: CanvasRenderingContext2D, g: Geom, diamDeg: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, Math.max(1.5, (diamDeg * g.ppd) / 2), 0, Math.PI * 2);
  ctx.fill();
}

export function drawUpDown(ctx: CanvasRenderingContext2D, stim: UpDownMotion, g: Geom, visible = true): void {
  const M = PROTOCOL.motion;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, g.w, g.h);
  if (visible) {
    const dot = dotPainter(ctx, g, M.dotDeg);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (const d of stim.dots) dot(d.x, d.y);
    ctx.fill();
  }
  drawSpot(ctx, g, M.fixationDeg, FIX_RED);
}

/** One Glass-pattern frame, or just the fixation point when frame is null. */
export function drawGlass(ctx: CanvasRenderingContext2D, frame: GlassFrame | null | undefined, g: Geom): void {
  const F = PROTOCOL.form;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, g.w, g.h);
  if (frame) {
    const dot = dotPainter(ctx, g, F.dotDeg), p = frame.pts;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (let i = 0; i < p.length; i += 2) dot(p[i]!, p[i + 1]!);
    ctx.fill();
  }
  drawSpot(ctx, g, F.fixationDeg, FIX_GREY);
}
