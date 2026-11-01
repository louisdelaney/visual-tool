// The full-viewport black stage the tasks and the blind-spot check run on. It's plain DOM and
// canvas, outside React, so nothing re-renders while stimuli are on screen.
import { Core } from "../core";
import { getState } from "../app/store";
import { dpr } from "../app/protocol";
import { esc } from "../app/format";
import { byId } from "./dom";
import type { Geom } from "./drawing";

export interface Stage {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Size in CSS pixels. */
  w: number;
  h: number;
  open: boolean;
  /** Redraws the current still frame after a resize, if there is one. */
  redraw: (() => void) | null;
  bg: string;
}

/** Stage geometry: Geom plus the unscaled pixels per degree and the scale applied to fit the window. */
export interface StageGeom extends Geom {
  ppd0: number;
  scale: number;
}

/** Returns true when it handled the key, so the default action is suppressed. */
export type KeyHandler = (e: KeyboardEvent) => boolean;

let stageRef: Stage | null = null;

/** The stage, created on first use from the elements in index.html. */
export function getStage(): Stage {
  if (!stageRef) {
    const canvas = byId<HTMLCanvasElement>("stage-canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D isn't available");
    stageRef = { el: byId("stage"), canvas, ctx, w: 0, h: 0, open: false, redraw: null, bg: "#000" };
  }
  return stageRef;
}

/** Who handles input while the stage is open. Each is set by whatever is running now. */
export const input: {
  key: KeyHandler | null;
  pointer: ((e: PointerEvent) => void) | null;
  /** Esc during a task or the blind-spot check. */
  esc: (() => void) | null;
  /** Esc while a message with a second button is showing; takes priority over esc. */
  msgEsc: (() => void) | null;
} = { key: null, pointer: null, esc: null, msgEsc: null };

export function clearStage(): void {
  const stage = getStage();
  stage.ctx.fillStyle = stage.bg;
  stage.ctx.fillRect(0, 0, stage.w, stage.h);
}

export function stageResize(): void {
  const stage = getStage();
  const ratio = dpr();
  stage.w = window.innerWidth;
  stage.h = window.innerHeight;
  stage.canvas.width = Math.max(1, Math.round(stage.w * ratio));
  stage.canvas.height = Math.max(1, Math.round(stage.h * ratio));
  stage.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  clearStage();
  if (stage.redraw) stage.redraw();
}

let wakeLock: WakeLockSentinel | null = null;

export function openStage(): void {
  const stage = getStage();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  byId("app").inert = true;
  stage.el.hidden = false;
  stage.open = true;
  document.documentElement.classList.add("staging");
  stageResize();
  if (navigator.wakeLock) navigator.wakeLock.request("screen").then(l => { wakeLock = l; }, () => {});
}

export function closeStage(): void {
  const stage = getStage();
  stage.el.hidden = true;
  stage.open = false;
  stage.redraw = null;
  stage.bg = "#000";
  stage.el.classList.remove("light");
  byId("app").inert = false;
  document.documentElement.classList.remove("staging");
  setHud("");
  byId("stage-msg").hidden = true;
  byId("stage-fb").hidden = true;
  byId("stage-note").hidden = true;
  byId("pause").hidden = true;
  stage.el.classList.remove("hide-cursor");
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

export function setHud(text: string): void {
  byId("hud").textContent = text;
}

export function stageNote(text: string): void {
  const n = byId("stage-note");
  n.textContent = text || "";
  n.hidden = !text;
}

/** Pixels per degree for the session's calibration, scaled down if the field doesn't fit. */
export function stageGeom(): StageGeom {
  const stage = getStage();
  const { calib, distance } = getState();
  if (!calib || !distance) throw new Error("The stage needs a screen size and a viewing distance");
  const ppd0 = Core.pxPerDeg(calib.pxPerMm * 10, distance.cm);
  const scale = Core.fitScale(stage.w, stage.h, ppd0);
  return { w: stage.w, h: stage.h, cx: stage.w / 2, cy: stage.h / 2, ppd0, scale, ppd: ppd0 * scale };
}

/** Wires keyboard, pointer and resize handling to the stage. Call once at start-up. */
export function initStage(): void {
  const stage = getStage();
  window.addEventListener("keydown", e => {
    if (!stage.open) return;
    if (e.key === "Escape") {
      const h = input.msgEsc || input.esc;
      if (h) { e.preventDefault(); h(); }
      return;
    }
    if (input.key && input.key(e)) e.preventDefault();
  });
  stage.canvas.addEventListener("pointerdown", e => { if (input.pointer) { e.preventDefault(); input.pointer(e); } });
  window.addEventListener("resize", () => { if (stage.open) stageResize(); });
}

export interface MessageOptions {
  /** Label of the main button, chosen with Space or Enter. */
  go?: string;
  /** Label of the optional second button, chosen with Esc. */
  alt?: string | null;
  /** What Esc does, for the hint line: "go back", "stop". */
  altVerb?: string;
}

/**
 * Shows a message on the stage. Resolves "go" for the main button and "alt" for the second.
 * html is trusted markup written in this codebase; anything user-supplied must go through esc().
 */
export function stageMessage(html: string, { go = "Continue", alt = null, altVerb = "" }: MessageOptions = {}): Promise<"go" | "alt"> {
  const stage = getStage();
  return new Promise(resolve => {
    const box = byId("stage-msg");
    const hint = `<kbd>Space</kbd> to continue${alt ? ` · <kbd>Esc</kbd> to ${esc(altVerb || alt.toLowerCase())}` : ""}`;
    box.innerHTML = `${html}<div class="msg-actions"><button class="btn" type="button" id="stage-msg-go">${esc(go)}</button>${alt ? `<button class="btn secondary" type="button" id="stage-msg-alt">${esc(alt)}</button>` : ""}<span class="hint">${hint}</span></div>`;
    box.hidden = false;
    stage.el.classList.remove("hide-cursor");
    setHud("");
    let done = false;
    const finish = (v: "go" | "alt"): void => { if (done) return; done = true; box.hidden = true; input.key = null; input.msgEsc = null; resolve(v); };
    byId("stage-msg-go").addEventListener("click", () => finish("go"));
    if (alt) byId("stage-msg-alt").addEventListener("click", () => finish("alt"));
    input.key = e => {
      if (e.target instanceof HTMLElement && e.target.id === "stage-msg-alt") return false;
      if ((e.key === " " || e.key === "Enter") && !e.repeat) { finish("go"); return true; }
      return false;
    };
    input.msgEsc = alt ? () => finish("alt") : null;
    setTimeout(() => { const b = document.getElementById("stage-msg-go"); if (b && !done) b.focus({ preventScroll: true }); }, 0);
  });
}

export async function feedback(correct: boolean, what: string): Promise<void> {
  const fb = byId("stage-fb");
  fb.textContent = correct ? "Correct" : `Not quite. ${what}`;
  fb.hidden = false;
  await new Promise(r => setTimeout(r, correct ? 700 : 1400));
  fb.hidden = true;
}

/** A steady fixation point for ms, left on into the stimulus that follows. */
export function fixation(ms: number, color: string, diamPx: number): Promise<void> {
  const stage = getStage();
  return new Promise(resolve => {
    const start = performance.now();
    const frame = (ts: number): void => {
      const t = Math.max(0, ts - start);
      clearStage();
      const r = Math.max(1.5, diamPx / 2);
      stage.ctx.fillStyle = color;
      stage.ctx.beginPath();
      stage.ctx.arc(stage.w / 2, stage.h / 2, r, 0, Math.PI * 2);
      stage.ctx.fill();
      if (t >= ms) { resolve(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/** Median time between animation frames over n frames, in ms. */
export function measureFrame(n = 90): Promise<number> {
  return new Promise(resolve => {
    const ts: number[] = [];
    const tick = (t: number): void => {
      ts.push(t);
      if (ts.length < n) { requestAnimationFrame(tick); return; }
      const d: number[] = [];
      for (let i = 1; i < ts.length; i++) d.push(ts[i]! - ts[i - 1]!);
      resolve(Core.median(d) || 1000 / 60);
    };
    requestAnimationFrame(tick);
  });
}
