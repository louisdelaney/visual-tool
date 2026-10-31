// The blind-spot check: with the right eye covered, the participant watches a square while a dot
// moves left, and presses Space when it vanishes. Where it vanished gives the viewing distance.
import { CALIBRATION, Core } from "../core";
import type { BlindSpotReading, Calibration, Distance } from "../app/types";
import { round } from "../app/format";
import { clearStage, closeStage, getStage, input, openStage, setHud, stageMessage } from "./stage";

// Where the fixation square goes. The page assumes you sit centred on the stage, so the
// fixating left eye is half an interpupillary distance left of centre. A square ~3 cm right
// of centre puts fixation and blind spot either side of that eye, where the estimate is
// least sensitive to where you actually sit. The dot must travel past the blind spot's centre
// (~15.5°; it starts to vanish at 13.5°) at up to ~80 cm, which needs 24 cm left of a centred
// square, so windows narrower than ~43 cm (laptops) put the square at the right edge instead.
// Colours: a red dot darker than a light grey ground, like the classic dark-spot-on-paper demo.
// A bright dot on black can stay faintly visible in the blind spot through scatter in the eye.
const BS = { bg: "#B4B4B4", square: "#000000", dot: "#C0281E" };

interface Layout {
  /** Square side and dot radius, px. */
  sq: number;
  rad: number;
  layout: "edge" | "centre";
  /** Square centre and the assumed left-eye position, px from the left. */
  sqX: number;
  eyeX: number;
}

function blindSpotLayout(pxPerCm: number): Layout {
  const stage = getStage();
  const sq = Math.max(14, 0.5 * pxPerCm);
  const rad = Math.max(5, 0.35 * pxPerCm);
  const edgeX = stage.w - Math.max(sq * 2, 1.5 * pxPerCm);
  const nearX = Math.min(edgeX, stage.w / 2 + CALIBRATION.blindSpotSquareCm * pxPerCm);
  const roomCm = (nearX - rad - 4) / pxPerCm;
  const layout = roomCm < 24 ? "edge" : "centre";
  return { sq, rad, layout, sqX: layout === "edge" ? edgeX : nearX, eyeX: stage.w / 2 - (CALIBRATION.ipdCm / 2) * pxPerCm };
}

interface Reading {
  /** Square and dot positions relative to the eye, and their separation, in cm. */
  squareCm: number;
  dotCm: number;
  offsetCm: number;
  layout: Layout["layout"];
}

type TrialOutcome = Reading | "missed" | "cancel" | "resized";

let blindCancel: (() => void) | null = null;

function blindSpotTrial(pxPerCm: number, rep: number): Promise<TrialOutcome> {
  const stage = getStage();
  return new Promise(resolve => {
    const ctx = stage.ctx;
    const L = blindSpotLayout(pxPerCm);
    const { sq, sqX, rad } = L;
    const w0 = stage.w, h0 = stage.h;
    const y = stage.h / 2;
    const speed = 2 * pxPerCm;
    let x = Math.max(rad + 8, sqX - 4 * pxPerCm), last: number | null = null, raf = 0, started = false;
    const draw = (): void => {
      clearStage();
      ctx.fillStyle = BS.square;
      ctx.fillRect(sqX - sq / 2, y - sq / 2, sq, sq);
      ctx.fillStyle = BS.dot;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    };
    const cleanup = (): void => { cancelAnimationFrame(raf); input.key = null; blindCancel = null; stage.redraw = null; };
    const frame = (ts: number): void => {
      if (stage.w !== w0 || stage.h !== h0) { cleanup(); resolve("resized"); return; }
      if (last !== null) x -= speed * (ts - last) / 1000;
      last = ts;
      if (x < rad + 4) { cleanup(); resolve("missed"); return; }
      draw();
      raf = requestAnimationFrame(frame);
    };
    stage.redraw = draw;
    draw();
    setHud(`Reading ${rep} of ${CALIBRATION.blindSpotReps} · Space when the dot disappears · Esc to stop`);
    blindCancel = () => { cleanup(); resolve("cancel"); };
    input.key = e => {
      if (e.key !== " " || e.repeat) return false;
      if (!started) return true;
      cleanup();
      resolve({ squareCm: (sqX - L.eyeX) / pxPerCm, dotCm: (x - L.eyeX) / pxPerCm, offsetCm: (sqX - x) / pxPerCm, layout: L.layout });
      return true;
    };
    setTimeout(() => { if (blindCancel) { started = true; raf = requestAnimationFrame(frame); } }, 800);
  });
}

/** Runs the whole check on the stage. Resolves the measured distance, or null if it was stopped. */
export async function runBlindSpot(calib: Calibration): Promise<Distance | null> {
  const stage = getStage();
  const pxPerCm = calib.pxPerMm * 10;
  const stop = (): null => { input.esc = null; closeStage(); return null; };
  const retry = async (html: string): Promise<boolean> => (await stageMessage(html, { go: "Try again", alt: "Stop", altVerb: "stop" })) === "go";
  stage.bg = BS.bg;
  stage.el.classList.add("light");
  openStage();
  input.esc = () => { if (blindCancel) blindCancel(); };
  const intro = await stageMessage(`<h2>Blind-spot check</h2><ol><li>Sit centred in front of the screen, the way you will for the test, about an arm's length away.</li><li>Cover your <strong>right</strong> eye with your hand.</li><li>Look at the black square and keep looking at it. Don't follow the dot: you'll still see it out of the corner of your eye.</li><li>A red dot moves left, vanishes for a second or two, then comes back. Press <kbd>Space</kbd> the moment it vanishes.</li></ol><p>This repeats ${CALIBRATION.blindSpotReps} times. Press <kbd>Esc</kbd> at any point to stop.</p>`, { go: "Start", alt: "Cancel", altVerb: "cancel" });
  if (intro !== "go") return stop();
  const readings: number[] = [], detail: BlindSpotReading[] = [];
  while (readings.length < CALIBRATION.blindSpotReps) {
    const r = await blindSpotTrial(pxPerCm, readings.length + 1);
    if (r === "cancel") return stop();
    if (r === "resized") continue;
    if (r === "missed") {
      if (!(await retry("<p>The dot reached the edge without you pressing <kbd>Space</kbd>. Check your right eye is fully covered, and keep your left eye on the square rather than the dot. If it still never vanishes, stop and enter your distance by hand.</p>"))) return stop();
      continue;
    }
    const cm = Core.distanceFromBlindSpotGeometry(r.squareCm, r.dotCm);
    if (cm == null || cm < 20 || cm > 150) {
      const what = cm == null ? "That reading doesn't fit the geometry." : `That reading works out at ${cm.toFixed(0)} cm, which is unlikely.`;
      if (!(await retry(`<p>${what} Press <kbd>Space</kbd> only once the dot has vanished completely.</p>`))) return stop();
      continue;
    }
    readings.push(cm);
    detail.push({ distance_cm: round(cm, 1), simple_formula_cm: round(Core.distanceFromBlindSpot(r.offsetCm), 1), square_cm: round(r.squareCm, 2), dot_cm: round(r.dotCm, 2), layout: r.layout });
  }
  const viewportCm: [number, number] = [round(stage.w / pxPerCm, 1), round(stage.h / pxPerCm, 1)];
  stop();
  return {
    cm: Core.mean(readings)!, method: "blind-spot", readings: readings.map(v => round(v, 1)),
    model: { angle_deg: CALIBRATION.blindSpotDeg, solve: "off-axis", eye: "left, assumed half an IPD left of centre", ipd_cm: CALIBRATION.ipdCm, positions: "cm from the eye's perpendicular foot" },
    detail, fullscreen: !!document.fullscreenElement, viewport_cm: viewportCm,
  };
}
