// One trial: fixation, the stimulus, the answer. A presenter shows the trial for one task;
// runTrial wraps it, records timing and builds the trial's data row.
import { Core, PROTOCOL, type GlassFrame, type Rng } from "../core";
import type { Answer, Session, TaskName, Trial, TrialPhase } from "../app/types";
import { round } from "../app/format";
import { drawGlass, drawUpDown, FIX_GREY, FIX_RED } from "./drawing";
import { clearStage, fixation, getStage, input, setHud, stageGeom, type StageGeom } from "./stage";
import { pause } from "./pause";

interface PresentArgs {
  s: Session;
  rng: Rng;
  /** The first rng() draw: decides the target in every task (the test harness relies on this). */
  first: boolean;
  /** 0 to 1. */
  coherence: number;
}

type Aborted = { aborted: true };

interface Presented {
  aborted?: false;
  target: Answer;
  response: Answer;
  /** When answering became possible, and when the answer came (performance.now()). */
  t0: number;
  t1: number;
  g: StageGeom;
  /** Frame-to-frame times while the stimulus was animating. */
  dts: number[];
  /** Fields this kind of trial adds to its data row. */
  extra?: Partial<Pick<Trial, "display_ms" | "frames" | "flash1_ms" | "flash2_ms" | "spiral_deg">>;
}

type PresentResult = Presented | Aborted;

let trialRaf = 0;

const RESPONSE_HUD = {
  updown: "Up: ↑  ·  Down: ↓  ·  Pause: Esc",
  spiral: "First flash: 1 or ←  ·  Second flash: 2 or →  ·  Pause: Esc",
};

type Answered = { response: Answer; t1: number } | Aborted;

/** Waits for one of the keys in map, or a click/tap that fromPointer turns into an answer. */
function awaitAnswer(map: Record<string, Answer>, fromPointer: (e: PointerEvent) => Answer): Promise<Answered> {
  return new Promise(resolve => {
    let settled = false;
    const settle = (v: Answered): void => { if (!settled) { settled = true; resolve(v); } };
    pause.abortTrial = () => settle({ aborted: true });
    input.key = e => {
      if (e.repeat) return false;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const answer = Object.prototype.hasOwnProperty.call(map, k) ? map[k] : undefined;
      if (!answer) return false;
      settle({ response: answer, t1: performance.now() });
      return true;
    };
    input.pointer = e => settle({ response: fromPointer(e), t1: performance.now() });
  });
}

/**
 * Runs frameFn on every frame until it returns false or the trial ends; resolves after the first
 * frame. frameFn gets the time since the last frame (null on the first) and the frame timestamp.
 */
function startLoop(frameFn: (dt: number | null, ts: number) => boolean | void): Promise<number> {
  return new Promise(resolve => {
    let last: number | null = null;
    const tick = (ts: number): void => {
      const more = frameFn(last === null ? null : ts - last, ts) !== false;
      if (last === null) resolve(ts);
      last = ts;
      if (more) trialRaf = requestAnimationFrame(tick);
    };
    trialRaf = requestAnimationFrame(tick);
  });
}

// Motion: 1 s fixation, then dots drifting up or down for a fixed 200 ms (Pavan et al. 2013).
// Answers count from the moment the dots appear, but an early answer doesn't cut the flash short,
// so every trial shows the same 200 ms.
async function presentUpDown({ s, rng, first, coherence }: PresentArgs): Promise<PresentResult> {
  const stage = getStage();
  const M = PROTOCOL.motion, g = stageGeom();
  const frameMs = s.frameMs ?? 1000 / 60;
  await fixation(M.fixationMs, FIX_RED, M.fixationDeg * g.ppd);
  if (pause.requested) return { aborted: true };
  const stim = new Core.UpDownMotion({ rng, coherence, direction: first ? -1 : 1, ...M });
  const dts: number[] = [];
  let ts0: number | null = null, shownMs = 0;
  let endFlash: () => void = () => {};
  const flashOver = new Promise<void>(resolve => { endFlash = resolve; });
  await startLoop((dt, ts) => {
    if (ts0 === null) ts0 = ts;
    if (dt != null) { dts.push(dt); stim.step(Math.min(dt, 50)); }
    if (ts - ts0 >= M.briefMs - frameMs / 2) {
      shownMs = ts - ts0;
      stage.redraw = () => drawUpDown(stage.ctx, stim, stageGeom(), false);
      stage.redraw();
      endFlash();
      return false;
    }
    drawUpDown(stage.ctx, stim, stageGeom(), true);
    return true;
  });
  if (pause.requested) return { aborted: true };
  const t0 = performance.now();
  setHud(RESPONSE_HUD.updown);
  const res = await awaitAnswer({ ArrowUp: "up", ArrowDown: "down" }, e => (e.clientY < stage.h / 2 ? "up" : "down"));
  if ("aborted" in res) return res;
  await flashOver; // a pause aborts above, so the loop is still running and this always resolves
  return { target: first ? "up" : "down", response: res.response, t0, t1: res.t1, g, dts, extra: { display_ms: round(shownMs, 1) } };
}

// Shows Glass-pattern frames for durMs (each unique frame for durMs / uniqueFrames), then blanks
// to the fixation point. Resolves the measured on-time, or null if a pause arrives mid-flash.
function flashFrames(frames: GlassFrame[], durMs: number, frameMs: number, log: { dts: number[]; frames: number }): Promise<number | null> {
  const stage = getStage();
  const per = durMs / PROTOCOL.form.uniqueFrames;
  return new Promise(resolve => {
    let ts0: number | null = null, last: number | null = null, done = false;
    pause.abortTrial = () => { if (!done) { done = true; cancelAnimationFrame(trialRaf); resolve(null); } };
    const tick = (ts: number): void => {
      if (done) return;
      if (ts0 === null) ts0 = ts;
      if (last !== null) log.dts.push(ts - last);
      last = ts;
      const el = ts - ts0;
      if (el >= durMs - frameMs / 2) {
        done = true;
        pause.abortTrial = null;
        drawGlass(stage.ctx, null, stageGeom());
        resolve(el);
        return;
      }
      drawGlass(stage.ctx, frames[Math.min(frames.length - 1, Math.floor(el / per))], stageGeom());
      log.frames += 1;
      trialRaf = requestAnimationFrame(tick);
    };
    trialRaf = requestAnimationFrame(tick);
  });
}

// Form: 1 s fixation, flash, 0.5 s gap, flash; one flash holds the spiral, the other
// the same number of randomly oriented dipoles. Which flash had the spiral?
async function presentSpiral({ s, rng, first, coherence }: PresentArgs): Promise<PresentResult> {
  const stage = getStage();
  const F = PROTOCOL.form, g = stageGeom();
  const frameMs = s.frameMs ?? 1000 / 60;
  const fixDiam = F.fixationDeg * g.ppd;
  const n = F.uniqueFrames;
  const handed = rng() < 0.5 ? 1 : -1;
  const make = (c: number): GlassFrame[] => Array.from({ length: n }, () => Core.glassFrame({ rng, coherence: c, ...F, handed }));
  const signal = make(coherence), noise = make(0);
  const order = first ? [signal, noise] : [noise, signal];
  await fixation(F.fixationMs, FIX_GREY, fixDiam);
  if (pause.requested) return { aborted: true };
  const log = { dts: [] as number[], frames: 0 }, shown: number[] = [];
  for (let k = 0; k < 2; k++) {
    const ms = await flashFrames(order[k]!, F.intervalMs, frameMs, log);
    if (ms == null || pause.requested) return { aborted: true };
    shown.push(ms);
    if (k === 0) {
      await fixation(F.gapMs, FIX_GREY, fixDiam);
      if (pause.requested) return { aborted: true };
    }
  }
  stage.redraw = () => drawGlass(stage.ctx, null, stageGeom());
  stage.redraw();
  const t0 = performance.now();
  setHud(RESPONSE_HUD.spiral);
  const res = await awaitAnswer({ "1": "1", ArrowLeft: "1", "2": "2", ArrowRight: "2" }, e => (e.clientX < stage.w / 2 ? "1" : "2"));
  if ("aborted" in res) return res;
  return {
    target: first ? "1" : "2", response: res.response, t0, t1: res.t1, g, dts: log.dts,
    extra: { frames: log.frames, flash1_ms: round(shown[0]!, 1), flash2_ms: round(shown[1]!, 1), spiral_deg: handed * F.spiralDeg },
  };
}

/** Runs one trial at level (coherence %). Resolves its data row, or aborted if a pause interrupted it. */
export async function runTrial(s: Session, task: TaskName, level: number, phase: TrialPhase, trialNo: number): Promise<Trial | Aborted> {
  const stage = getStage();
  s.attempts += 1;
  const seed = Core.mixSeed(s.seed, task === "motion" ? 1 : 2, s.attempts);
  const rng = Core.mulberry32(seed);
  const first = rng() < 0.5;
  pause.inTrial = true;
  stage.el.classList.add("hide-cursor");
  setHud("");
  const args: PresentArgs = { s, rng, first, coherence: level / 100 };
  let out: PresentResult;
  try {
    out = task === "motion" ? await presentUpDown(args) : await presentSpiral(args);
  } finally {
    cancelAnimationFrame(trialRaf);
    input.key = null;
    input.pointer = null;
    pause.abortTrial = null;
    stage.redraw = null;
    pause.inTrial = false;
    setHud("");
    clearStage();
  }
  if (out.aborted) return { aborted: true };
  const frameMs = s.frameMs ?? 1000 / 60;
  const dts = out.dts;
  return {
    protocol: s.settings.protocol, task, phase, trial: trialNo,
    level_pct: round(level, 3),
    effective_level_pct: round(level, 3),
    target: out.target, response: out.response, correct: out.response === out.target,
    rt_ms: Math.round(out.t1 - out.t0),
    reversal: false,
    frames: dts.length ? dts.length + 1 : null,
    median_frame_ms: dts.length ? round(Core.median(dts)!, 2) : null,
    dropped_frames: dts.length ? dts.filter(d => d > 1.5 * frameMs).length : null,
    display_ms: null, flash1_ms: null, flash2_ms: null, spiral_deg: null,
    scale: round(out.g.scale, 4),
    px_per_deg: round(out.g.ppd, 3),
    seed,
    at: new Date().toISOString(),
    ...out.extra,
  };
}
