// Pins the test's parameters to TEST_VERSION, and the export's shape to SCHEMA_VERSION, so
// neither can change by accident. If one of these fails because you meant to change something,
// bump the version and update the expected values here.
import assert from "node:assert/strict";
import { test } from "vitest";
import { CALIBRATION, PROTOCOL, Staircase, TEST_VERSION } from "../../src/core";
import { exportObject } from "../../src/app/export";
import { SCHEMA_VERSION } from "../../src/app/schema";
import type { Session } from "../../src/app/types";

test("test version 2: the parameters participants see are unchanged", () => {
  assert.equal(TEST_VERSION, 2, "TEST_VERSION changed: update the expected parameters below to match");
  assert.deepEqual(JSON.parse(JSON.stringify(PROTOCOL)), {
    field: { w: 11, h: 11 },
    motion: { apertureDeg: 8, dots: 250, dotDeg: 0.03, speed: 20.1, lifetimeMs: 83.3, fixationDeg: 0.4, fixationMs: 1000, briefMs: 200 },
    form: { radiusDeg: 5.35, dipoles: 2146, dotDeg: 0.04, separationDeg: 0.25, spiralDeg: 0, uniqueFrames: 12, intervalMs: 200, gapMs: 500, fixationMs: 1000, fixationDeg: 0.3 },
    staircase: { start: 100, factor: 0.84, down: 3, min: 1, max: 100, catchEvery: 8, practiceTrials: 4, maxTrials: 150 },
    run: { stopReversals: 16, meanOfLast: 12 },
  }, "A test parameter changed. That makes a different test: bump TEST_VERSION in src/core/protocol.ts.");
  assert.deepEqual(JSON.parse(JSON.stringify(CALIBRATION)), {
    cardMm: { w: 85.6, h: 53.98 }, blindSpotDeg: 13.5, blindSpotReps: 5, blindSpotSquareCm: 3, ipdCm: 6.3,
  }, "A calibration parameter changed. That makes a different test: bump TEST_VERSION in src/core/protocol.ts.");
});

const session: Session = {
  page: "Form–Motion Coherence Test", testVersion: TEST_VERSION, seed: 1,
  startedAt: "2026-10-30T12:00:00.000Z", finishedAt: "2026-10-30T12:10:00.000Z", endedEarly: false,
  settings: { protocol: "clinic", motionDisplay: "brief", spiralDots: "flicker", order: "motion-first", run: "published" },
  calibration: { cardPx: 323.5, pxPerMm: 3.78, dpr: 2, measuredAt: "2026-10-30T12:00:00.000Z" },
  distance: { cm: 50, method: "manual", readings: [] },
  frameMs: 16.7, refreshHz: 60, display: { ppd0: 33, scale: 1, viewport: [1440, 900], fullscreen: true }, attempts: 0,
  env: { browser: "Chrome 131 on macOS", language: "en-GB", screen: [1440, 900], viewport: [1440, 900], devicePixelRatio: 2 },
  tasks: { motion: { task: "motion", staircase: new Staircase(), trials: [], endedEarly: false } },
  trials: [], results: null,
  contribution: { contribute: true, submission_id: "abc", sent_at: null, sending: true, failed: false, delete_token: "secret", removal: "failed", answers: { pseudonym: null, perceptual_disorder: "no", condition: null, other_condition: null, diagnosed: null, psychedelics: "no", psychedelic_uses: null, psychedelics_used: null, takes_medication: null, medications: null, notes: null, found_via: null, found_via_other: null } },
};

test("schema version 1: the export's fields are unchanged", () => {
  const out = exportObject(session);
  assert.equal(SCHEMA_VERSION, 1, "SCHEMA_VERSION changed: update the expected fields below to match");
  assert.equal(out.schema, "visual-tool/session");
  assert.equal(out.schema_version, 1);
  assert.equal(out.test_version, TEST_VERSION);
  assert.deepEqual(Object.keys(out), [
    "schema", "schema_version", "test_version", "page", "started_at", "finished_at", "ended_early", "seed",
    "settings", "protocol", "sensitivity_units", "calibration", "viewing_distance", "display", "environment",
    "contribution", "results", "trials",
  ], "The export's fields changed. Bump SCHEMA_VERSION in src/app/schema.ts and update its type.");
  assert.deepEqual(Object.keys(out.contribution ?? {}), ["contribute", "submission_id", "sent_at", "answers"], "Sending and removal state must not be exported");
  assert.equal(JSON.stringify(out).includes('"tasks"'), false, "In-memory staircases must not be exported");
});
