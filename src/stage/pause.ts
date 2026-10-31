// Pausing a task: Esc, leaving full screen or switching tabs mid-trial opens the pause box. The
// trial in progress is abandoned and restarts, with a new pattern, on resume.
import { byId } from "./dom";
import { getStage } from "./stage";

export type PauseChoice = "resume" | "end";

export const pause: {
  open: boolean;
  /** A pause was asked for; presenters check this between phases and bail out. */
  requested: boolean;
  /** A trial is running, so a pause should interrupt it. */
  inTrial: boolean;
  /** Abandons the trial in progress. Set by whatever is waiting on the participant. */
  abortTrial: (() => void) | null;
  decide: ((choice: PauseChoice) => void) | null;
  /** A choice made before anything was waiting for it. */
  pending: PauseChoice | null;
} = { open: false, requested: false, inTrial: false, abortTrial: null, decide: null, pending: null };

export function openPause(): void {
  if (pause.open) return;
  pause.open = true;
  pause.requested = true;
  pause.pending = null;
  if (pause.abortTrial) pause.abortTrial();
  byId("pause").hidden = false;
  getStage().el.classList.remove("hide-cursor");
  setTimeout(() => byId("pause-resume").focus({ preventScroll: true }), 0);
}

function decidePause(choice: PauseChoice): void {
  byId("pause").hidden = true;
  pause.open = false;
  if (pause.decide) { const d = pause.decide; pause.decide = null; pause.requested = false; d(choice); }
  else pause.pending = choice;
}

export function waitForPauseDecision(): Promise<PauseChoice> {
  return new Promise(resolve => {
    if (pause.pending) { const c = pause.pending; pause.pending = null; pause.requested = false; resolve(c); }
    else pause.decide = resolve;
  });
}

/** Esc during a task: pauses mid-trial, or resumes if already paused. */
export const taskEsc = (): void => { if (pause.open) decidePause("resume"); else if (pause.inTrial) openPause(); };

/** Wires the pause buttons, and pauses when the participant leaves full screen or the tab. Call once. */
export function initPause(): void {
  byId("pause-resume").addEventListener("click", () => decidePause("resume"));
  byId("pause-end").addEventListener("click", () => decidePause("end"));
  const interrupt = (): void => { if (getStage().open && pause.inTrial && !pause.open) openPause(); };
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) interrupt(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) interrupt(); });
}
