// Moving between steps, and the actions that hand over to the stage: running a task and the
// blind-spot check.
import { INFO_PAGES, type Step, type TaskName, type View } from "./types";
import { TASK_ORDER } from "./protocol";
import { round } from "./format";
import { calibMatchesScreen, getState, setState, touch } from "./store";
import { createSession, finalizeSession } from "./session";
import { sendContribution } from "./contribution";
import { closeStage, getStage, input, measureFrame, openStage, stageGeom, stageNote } from "../stage/stage";
import { taskEsc } from "../stage/pause";
import { runTask } from "../stage/task";
import { runBlindSpot } from "../stage/blindSpot";
import { wantFullscreen } from "../stage/fullscreen";

/** Shows a step or page, with an optional one-line message above it. Info pages get their own address. */
export function show(view: View, message = ""): void {
  const { view: current, returnTo } = getState();
  const isInfo = (INFO_PAGES as readonly View[]).includes(view);
  // Back from an info page returns to the step that was showing before it.
  const nextReturn: Step = (INFO_PAGES as readonly View[]).includes(current) ? returnTo : (current as Step);
  setState({ view, flash: message, returnTo: isInfo ? nextReturn : returnTo });
  const hash = isInfo ? `#${view}` : "";
  if (window.location.hash !== hash) history.replaceState(null, "", hash || window.location.pathname + window.location.search);
  window.scrollTo(0, 0);
}

/**
 * Follows the address: a link to #privacy or similar, or the browser's Back and Forward buttons,
 * switches pages without reloading. Leaving an info page's address returns to the step. Call once.
 */
export function initRouting(): void {
  window.addEventListener("hashchange", () => {
    const page = window.location.hash.slice(1);
    const { view, busy } = getState();
    if (busy) return;
    if ((INFO_PAGES as readonly string[]).includes(page)) { if (page !== view) show(page as View); }
    else if ((INFO_PAGES as readonly View[]).includes(view)) back();
  });
}

/**
 * Back to the start page for a fresh run: step 1's answers and any session are cleared (the card
 * measurement is kept). Asks first if that would throw away real results.
 */
export function goHome(): void {
  const { session } = getState();
  if (session?.results && !window.confirm("Leave your results and start again? Save them first if you want a copy.")) return;
  setState({ contribution: null, session: null, distance: null, historyPseudonym: "" });
  show("contribute");
}

/** Back from a task's intro: to the earlier task, or to the viewing distance before the first. */
export function backFromTask(task: TaskName): void {
  const i = TASK_ORDER.indexOf(task);
  if (i === 0) { show("distance"); return; }
  const prev = TASK_ORDER[i - 1]!;
  const s = getState().session;
  if (s?.tasks[prev]) {
    if (!window.confirm(`Go back and redo the ${prev} task? Your ${prev} results so far will be replaced.`)) return;
    s.trials = s.trials.filter(t => t.task !== prev);
    delete s.tasks[prev];
  }
  show(prev);
}

/** Leaves an info page for the step that was showing before it. */
export const back = (): void => show(getState().returnTo);

/** Opens past results, looking up this pseudonym straight away if one is given. */
export function showHistory(pseudonym = ""): void {
  setState({ historyPseudonym: pseudonym });
  show("history");
}

/** Runs one task on the stage, then moves on to the next task or the results. */
export async function startTask(task: TaskName): Promise<void> {
  const st = getState();
  if (st.busy) return;
  if (!st.calib || !st.distance) { show("screen"); return; }
  if (!calibMatchesScreen(st.calib)) { show("screen", "Your browser zoom or screen has changed since you measured the card. Measure it again."); return; }
  const s = st.session ?? createSession();
  setState({ busy: true });
  try {
    wantFullscreen();
    openStage();
    input.esc = taskEsc;
    if (!s.frameMs) {
      stageNote("Getting ready…");
      s.frameMs = await measureFrame();
      s.refreshHz = 1000 / s.frameMs;
      const g = stageGeom(), stage = getStage();
      s.display = { ppd0: round(g.ppd0, 3), scale: round(g.scale, 4), viewport: [stage.w, stage.h], fullscreen: !!document.fullscreenElement };
      stageNote("");
    }
    const rec = await runTask(s, task);
    input.esc = null;
    closeStage();
    if (!rec) { show(task); return; }
    const i = TASK_ORDER.indexOf(task);
    if (rec.endedEarly || i === TASK_ORDER.length - 1) {
      s.endedEarly = rec.endedEarly;
      finalizeSession(s);
      show("results");
      void sendContribution(s);
    } else {
      touch();
      show(TASK_ORDER[i + 1]!);
    }
  } catch (err) {
    console.error(err);
    input.esc = null;
    closeStage();
    show(task, "Something went wrong while running the task. Try starting it again.");
  } finally {
    setState({ busy: false });
  }
}

/** Runs the blind-spot check and keeps the distance it measures. */
export async function measureDistance(): Promise<void> {
  const st = getState();
  if (st.busy) return;
  if (!st.calib) { show("screen"); return; }
  setState({ busy: true });
  wantFullscreen();
  try {
    const distance = await runBlindSpot(st.calib);
    if (distance) setState({ distance });
  } finally {
    setState({ busy: false });
  }
}
