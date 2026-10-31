// App state, shared by the React pages and the imperative stage code. React reads it through
// useAppState(); anything can read getState() and change it with setState().
//
// Sessions are mutated in place while a task runs (trials are pushed as they happen), so after
// changing one, call touch() to tell the pages to re-render.
import { useSyncExternalStore } from "react";
import { INFO_PAGES, type Calibration, type ContributionChoice, type Distance, type InfoPage, type Session, type Step, type View } from "./types";
import { dpr } from "./protocol";

export interface AppState {
  view: View;
  /** A one-line message shown above the current page, or "". */
  flash: string;
  /** The answer given at step 1, or null before it's answered. */
  contribution: ContributionChoice | null;
  calib: Calibration | null;
  distance: Distance | null;
  session: Session | null;
  /** A task or the blind-spot check is running. */
  busy: boolean;
  /** Where an info page's Back button goes: the step that was showing before. */
  returnTo: Step;
  /** The pseudonym the history page opens with. */
  historyPseudonym: string;
}

// Only the card measurement is remembered between visits. Older versions also saved test
// settings under this key; they're ignored, so nobody can bring back an option that's gone.
const STORE_KEY = "form-motion-coherence/v1";

function loadCalib(): Calibration | null {
  let saved: unknown = null;
  try { saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null"); } catch { /* storage blocked or corrupt */ }
  const c = saved && typeof saved === "object" ? (saved as { calib?: Partial<Calibration> }).calib : undefined;
  return c && typeof c.pxPerMm === "number" && c.pxPerMm > 0 && typeof c.cardPx === "number" && c.cardPx > 0 ? (c as Calibration) : null;
}

function persist(s: AppState): void {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ calib: s.calib })); } catch { /* storage blocked */ }
}

let state: AppState = { view: "contribute", flash: "", contribution: null, calib: loadCalib(), distance: null, session: null, busy: false, returnTo: "contribute", historyPseudonym: "" };

// Opened at #privacy, #references or #history: start on that page.
const linked = window.location.hash.slice(1) as InfoPage;
if ((INFO_PAGES as readonly string[]).includes(linked)) state = { ...state, view: linked };
const listeners = new Set<() => void>();

export const getState = (): AppState => state;

export function setState(patch: Partial<AppState>): void {
  const next = { ...state, ...patch };
  if (patch.calib !== undefined) persist(next);
  state = next;
  for (const l of listeners) l();
}

/** Re-render after mutating the session in place. */
export const touch = (): void => setState({});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState);
}

/** The saved card size still applies only at the zoom and pixel ratio it was measured at. */
export const calibMatchesScreen = (calib: Calibration | null = state.calib): calib is Calibration =>
  !!(calib && Math.abs((calib.dpr || 1) - dpr()) < 0.01);
