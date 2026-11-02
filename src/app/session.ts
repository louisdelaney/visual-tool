// Creating a session from the current state, and scoring it when the tasks end.
import { Core, PROTOCOL, TEST_VERSION } from "../core";
import type { Results, Session, TaskResult } from "./types";
import { dpr, PAGE_NAME, SETTINGS } from "./protocol";
import { round, shortUA } from "./format";
import { getState, setState } from "./store";

export function newSeed(): number {
  try { return window.crypto.getRandomValues(new Uint32Array(1))[0]!; } catch { return (Math.random() * 4294967296) >>> 0; }
}

export const newId = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");

/** Starts a session with the current settings and calibration, and makes it the current one. */
export function createSession(): Session {
  const { calib, distance, contribution } = getState();
  const session: Session = {
    page: PAGE_NAME,
    testVersion: TEST_VERSION,
    seed: newSeed(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    endedEarly: false,
    settings: { ...SETTINGS },
    calibration: calib ? { ...calib } : null,
    distance: distance ? { ...distance, readings: [...distance.readings] } : null,
    frameMs: null, refreshHz: null, display: null, attempts: 0,
    env: { browser: shortUA(navigator.userAgent), language: navigator.language, screen: [screen.width, screen.height], viewport: [window.innerWidth, window.innerHeight], devicePixelRatio: dpr() },
    tasks: {}, trials: [], results: null,
    contribution: !contribution ? null
      : contribution.contribute ? { contribute: true, submission_id: newId(), sent_at: null, answers: { ...contribution.answers } }
      : { contribute: false },
  };
  setState({ session });
  return session;
}

/** Works out each task's threshold and sensitivity from its staircase. */
export function finalizeSession(s: Session): void {
  s.finishedAt = s.finishedAt || new Date().toISOString();
  const run = PROTOCOL.run;
  const scored = { motion: null as TaskResult | null, form: null as TaskResult | null };
  for (const task of ["motion", "form"] as const) {
    const rec = s.tasks[task];
    if (!rec) continue;
    const sc = rec.staircase;
    const revs = sc.reversals.map(r => r.level);
    let nominal: number | null = null, status: TaskResult["status"];
    if (revs.length >= run.stopReversals) { status = "complete"; nominal = sc.threshold; }
    else if (revs.length >= run.meanOfLast) { status = "incomplete"; nominal = sc.threshold; }
    else if (revs.length >= 2) { status = "incomplete"; nominal = Core.geometricMean(revs); }
    else status = "not reached";
    const thr = nominal;
    const catches = rec.trials.filter(t => t.phase === "catch");
    const sens = thr == null ? null : Core.sensitivity(thr);
    scored[task] = {
      status,
      threshold_pct: thr == null ? null : round(thr, 3),
      threshold_nominal_pct: nominal == null ? null : round(nominal, 3),
      sensitivity: sens == null ? null : round(sens, 5),
      reversals_pct: revs.map(v => round(v, 3)),
      staircase_trials: sc.history.length,
      catch_correct: catches.filter(t => t.correct).length,
      catch_total: catches.length,
      all_trials: rec.trials.length,
    };
  }
  const m = scored.motion, f = scored.form;
  const results: Results = {
    ...scored,
    motion_minus_form: m && f && m.sensitivity != null && f.sensitivity != null && m.threshold_pct != null && f.threshold_pct != null
      ? { sensitivity: round(m.sensitivity - f.sensitivity, 5), threshold_ratio: round(m.threshold_pct / f.threshold_pct, 4) }
      : null,
  };
  s.results = results;
}
