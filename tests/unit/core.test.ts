// Unit tests for the core: staircase, stimuli, geometry and CSV. Some run thousands of simulated
// staircases, so they take a few seconds.
import assert from "node:assert/strict";
import { test } from "vitest";
import * as C from "../../src/core";

const P = C.PROTOCOL;
// A 2-down/1-up staircase stopping at 6 reversals: checks the staircase class itself, independently of the test's 3-down settings.
const TWO_DOWN: C.StaircaseSpec = { start: 100, factor: 0.84, down: 2, min: 1, max: 100, catchEvery: 4, practiceTrials: 3, maxTrials: 100 };
const SHORT_RUN = { stopReversals: 6, meanOfLast: 4 };
const near = (a: number, b: number, tol: number, msg: string): void => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

test("staircase: 1-down until first error, then 2-down/1-up with x0.84 steps", () => {
  const sc = new C.Staircase({ stopReversals: 6, meanOfLast: 4 });
  // 100 -> 84 -> 70.56 (correct, correct), error at 70.56 -> up to 84 (reversal 1 at 70.56)
  sc.record(true); sc.record(true);
  near(sc.level, 70.56, 1e-9, "after two correct in initial phase");
  let r = sc.record(false);
  assert.equal(r.reversal, true);
  near(sc.level, 84, 1e-9, "error steps up by 1/0.84");
  // one correct: no change
  sc.record(true);
  near(sc.level, 84, 1e-9, "single correct holds level");
  // second correct: down, reversal 2 at 84
  r = sc.record(true);
  assert.equal(r.reversal, true);
  near(sc.level, 70.56, 1e-9, "two correct steps down");
  // error resets streak: correct, error -> up (reversal 3 at 70.56)
  sc.record(true);
  r = sc.record(false);
  assert.equal(r.reversal, true);
  near(sc.level, 84, 1e-9, "error after one correct steps up");
  assert.deepEqual(sc.reversals.map(v => +v.level.toFixed(2)), [70.56, 84, 70.56]);
});

test("staircase: clamps at 100 and stops at 6 reversals; threshold = mean of last 4", () => {
  const sc = new C.Staircase({ stopReversals: 6, meanOfLast: 4 });
  sc.record(false); // error at 100 -> stays 100 (clamped), first step is up, no reversal yet
  assert.equal(sc.level, 100);
  assert.equal(sc.reversals.length, 0);
  const pattern = [true, true, false, true, true, false, true, true, false, true, true, false];
  for (const c of pattern) { if (sc.done) break; sc.record(c); }
  assert.equal(sc.reversals.length, 6);
  assert.ok(sc.done);
  const last4 = sc.reversals.slice(-4).map(r => r.level);
  near(sc.threshold!, last4.reduce((a, b) => a + b, 0) / 4, 1e-12, "threshold");
});

test("staircase: maxTrials guard", () => {
  const sc = new C.Staircase({ maxTrials: 10 });
  for (let i = 0; i < 50 && !sc.done; i++) sc.record(false);
  assert.equal(sc.history.length, 10);
  assert.ok(sc.done);
});

test("simulated observers: a 2-down staircase converges near the 70.7% point (log-symmetric steps)", () => {
  const rng = C.mulberry32(12345);
  const alpha = 10, beta = 2, lapse = 0.02;
  // theoretical 70.7% point for this psychometric function
  const target = alpha * Math.pow(-Math.log(1 - (0.7071 - 0.5) / (0.5 - lapse)), 1 / beta);
  const runs = 3000, thr: number[] = [], trials: number[] = [];
  for (let i = 0; i < runs; i++) {
    const r = C.simulateRun({ alpha, beta, lapse, rng, run: SHORT_RUN, staircase: TWO_DOWN });
    thr.push(r.staircase.threshold!);
    trials.push(r.trials.length);
  }
  const logMean = Math.exp(thr.reduce((a, v) => a + Math.log(v), 0) / runs);
  const med = C.median(thr)!;
  console.log(`   published 6/4 run: theory ${target.toFixed(2)}%  geo-mean ${logMean.toFixed(2)}%  median ${med.toFixed(2)}%  mean trials/run ${(trials.reduce((a, b) => a + b, 0) / runs).toFixed(1)}`);
  // Short runs from 100% carry a known upward bias; it must stay between the 70.7% and 80% points.
  const pcAt = C.weibull2afc(logMean, alpha, beta, lapse);
  assert.ok(pcAt > 0.707 && pcAt < 0.80, `published run converges between 70.7% and 80% correct (got ${pcAt.toFixed(3)})`);
  // Long run with the same x0.84 steps must land on the 70.7% point: this is the implementation check.
  const long: number[] = [];
  for (let i = 0; i < 1500; i++) long.push(C.simulateRun({ alpha, beta, lapse, rng, run: { stopReversals: 80, meanOfLast: 70 }, staircase: { ...TWO_DOWN, maxTrials: 100000 } }).staircase.threshold!);
  const longMean = Math.exp(long.reduce((a, v) => a + Math.log(v), 0) / long.length);
  console.log(`   long 80-reversal run: geo-mean ${longMean.toFixed(2)}%`);
  assert.ok(Math.abs(Math.log(longMean / target)) < 0.03, "long run within 3% of the 70.7% point");
  // run-to-run spread with only 4 reversals is large; report it
  const sd = Math.sqrt(thr.reduce((a, v) => a + (Math.log(v) - Math.log(logMean)) ** 2, 0) / runs);
  console.log(`   log-SD of single-run thresholds ${sd.toFixed(3)} (≈ ×${Math.exp(sd).toFixed(2)})`);
});

test("geometry: virtual chinrest maths", () => {
  // 13.5 deg blind spot at 50 cm -> 11.99 cm
  near(C.distanceFromBlindSpot(50 * Math.tan(13.5 * Math.PI / 180)), 50, 1e-9, "blind spot inverse");
  // 96 dpi reference pixel (37.795 px/cm) at 50 cm
  near(C.pxPerDeg(37.795, 50), 32.99, 0.01, "px per degree");
  assert.equal(C.fitScale(1440, 900, 30), 1);
  near(C.fitScale(1280, 720, 33, 30, 24), (720 - 20) / (24 * 33), 1e-12, "height-limited fit");
  assert.equal(C.fitScale(1280, 720, 33), 1, "the test's 11° field fits");
  near(C.sensitivity(10)!, 0.1, 1e-12, "sensitivity is 1/threshold%");
  assert.equal(C.sensitivity(0), null);
});

test("csv: escapes quotes, commas, newlines; nulls blank", () => {
  const csv = C.toCSV([{ a: 'x,"y"', b: null, c: "line\nbreak", d: 3 }], ["a", "b", "c", "d"]);
  assert.equal(csv, 'a,b,c,d\n"x,""y""",,"line\nbreak",3');
});

test("rng: deterministic and in [0,1)", () => {
  const a = C.mulberry32(42), b = C.mulberry32(42);
  for (let i = 0; i < 1000; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
  assert.notEqual(C.mixSeed(1, 1, 1), C.mixSeed(1, 1, 2));
});


test("blind spot: off-axis solve recovers the true distance (square < 45° off-axis)", () => {
  const A = 13.5 * Math.PI / 180;
  const rng = C.mulberry32(5);
  let n = 0;
  for (let i = 0; i < 20000; i++) {
    const D = 25 + rng() * 100, s = -20 + rng() * 60;
    if (Math.abs(s) >= D) continue; // beyond 45° two distances fit; the solver takes the far one by design
    const x = D * Math.tan(Math.atan(s / D) - A);
    near(C.distanceFromBlindSpotGeometry(s, x)!, D, 1e-9, `s=${s.toFixed(2)} D=${D.toFixed(2)}`);
    n++;
  }
  assert.ok(n > 15000);
  // the ambiguity, made explicit: a square 54° off-axis at 25 cm reads as the far solution
  const sx = 34.32, Dn = 25.22, xx = Dn * Math.tan(Math.atan(sx / Dn) - A);
  assert.ok(C.distanceFromBlindSpotGeometry(sx, xx)! > Math.sqrt(sx * xx), "far root above sqrt(s·x)");
  // square straight ahead of the eye: identical to Li et al.'s formula
  near(C.distanceFromBlindSpotGeometry(0, -12)!, C.distanceFromBlindSpot(12), 1e-12, "s = 0 case");
  assert.equal(C.distanceFromBlindSpotGeometry(5, 6), null, "dot right of square");
  assert.equal(C.distanceFromBlindSpotGeometry(40, 39.9), null, "offset too small for this geometry");
  near(C.angularExtentDeg(2 * 50 * Math.tan(15 * Math.PI / 180), 50), 30, 1e-9, "angular extent");
});

test("staircase: 3-down/1-up converges on the 79.4% point; the test's run length", () => {
  const rng = C.mulberry32(77), alpha = 10, beta = 2, lapse = 0.02;
  const p794 = alpha * Math.pow(-Math.log(1 - (0.7937 - 0.5) / (0.5 - lapse)), 1 / beta);
  const S = P.staircase, long: number[] = [], std: number[] = [], n: number[] = [];
  for (let i = 0; i < 1500; i++) long.push(C.simulateRun({ alpha, beta, lapse, rng, run: { stopReversals: 80, meanOfLast: 70 }, staircase: { ...S, maxTrials: 100000 } }).staircase.threshold!);
  for (let i = 0; i < 2000; i++) { const r = C.simulateRun({ alpha, beta, lapse, rng, run: P.run, staircase: S }); std.push(Math.log(r.staircase.threshold!)); n.push(r.trials.length); }
  const gm = Math.exp(long.reduce((a, v) => a + Math.log(v), 0) / long.length);
  const m = std.reduce((a, b) => a + b, 0) / std.length, sd = Math.sqrt(std.reduce((a, b) => a + (b - m) ** 2, 0) / std.length);
  console.log(`   79.4% point ${p794.toFixed(2)}%, long run ${gm.toFixed(2)}%; standard run geo-mean ${Math.exp(m).toFixed(2)}%, log-SD ${sd.toFixed(3)}, trials ${(n.reduce((a, b) => a + b, 0) / n.length).toFixed(0)}`);
  assert.ok(Math.abs(Math.log(gm / p794)) < 0.03, "long run within 3% of 79.4% point");
});

test("up/down motion: signal dots move vertically at 20.1 deg/s, noise replotted every frame", () => {
  const M = P.motion;
  for (const dir of [-1, 1] as const) {
    const m = new C.UpDownMotion({ rng: C.mulberry32(3 + dir), coherence: 0.4, direction: dir, ...M });
    assert.equal(m.dots.length, 250); assert.equal(m.nSignal, 100);
    const snap = m.dots.map(d => ({ x: d.x, y: d.y, age: d.age }));
    const dt = 1000 / 60; m.step(dt);
    let moved = 0, noiseJumps = 0;
    m.dots.forEach((d, i) => {
      const o = snap[i]!;
      assert.ok(Math.abs(d.x) <= 4 && Math.abs(d.y) <= 4, "inside aperture");
      if (o.age + dt >= M.lifetimeMs) return;
      if (d.signal) {
        let dy = d.y - o.y; if (Math.abs(dy) > 4) dy -= Math.sign(dy) * 8;
        assert.equal(d.x, o.x); near(dy, dir * 20.1 * dt / 1000, 1e-9, "signal step"); moved++;
      } else if (Math.hypot(d.x - o.x, d.y - o.y) > 0.5) noiseJumps++;
    });
    assert.ok(moved > 60 && noiseJumps > 100);
  }
});

test("spiral Glass frame: counts, separation, inside the disc, signal at 45 deg to the radius", () => {
  const F = P.form;
  for (const handed of [1, -1] as const) {
    const f = C.glassFrame({ rng: C.mulberry32(11), coherence: 0.3, handed, ...F });
    assert.equal(f.pts.length, 2146 * 4); assert.equal(f.nSignal, Math.round(0.3 * 2146));
    for (let i = 0; i < 2146; i++) {
      const x1 = f.pts[i * 4]!, y1 = f.pts[i * 4 + 1]!, x2 = f.pts[i * 4 + 2]!, y2 = f.pts[i * 4 + 3]!;
      near(Math.hypot(x2 - x1, y2 - y1), 0.25, 1e-5, "separation");
      assert.ok(Math.hypot(x1, y1) <= 5.35 + 1e-5 && Math.hypot(x2, y2) <= 5.35 + 1e-5, "inside disc");
      if (i < f.nSignal) {
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const rel = Math.atan2(y2 - y1, x2 - x1) - Math.atan2(cy, cx);
        // angle between dipole axis and radius, as an axis (mod 180), signed by handedness
        let a = ((rel * 180 / Math.PI) % 180 + 180) % 180; if (a > 90) a -= 180;
        near(a, handed * 45, 1e-3, "spiral angle");
      }
    }
  }
  assert.equal(C.glassFrame({ rng: C.mulberry32(1), coherence: 0, ...F }).nSignal, 0);
});
