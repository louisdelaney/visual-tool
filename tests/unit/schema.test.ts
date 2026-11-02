// Pins the test's parameters to TEST_VERSION, and the export's shape to SCHEMA_VERSION, so
// neither can change by accident. If one of these fails because you meant to change something,
// bump the version and update the expected values here.
import assert from "node:assert/strict";
import { test } from "vitest";
import { CALIBRATION, PROTOCOL, PROTOCOLS, QUICK_PROTOCOL, Staircase, TEST_VERSION } from "../../src/core";
import { CSV_COLUMNS, exportObject, summaryJSON, trialsCSV } from "../../src/app/export";
import { SCHEMA_VERSION } from "../../src/app/schema";
import type { Session, Trial } from "../../src/app/types";

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

test("test version 2: the quick test is the full test's stimuli with a shorter run, and nothing else", () => {
  assert.deepEqual(Object.keys(PROTOCOLS), ["full", "quick"], "There are exactly two types of test (AGENTS.md)");
  assert.equal(PROTOCOLS.full, PROTOCOL);
  assert.equal(PROTOCOLS.quick, QUICK_PROTOCOL);
  const { staircase, run, ...rest } = JSON.parse(JSON.stringify(QUICK_PROTOCOL));
  const { staircase: fullStaircase, run: _fullRun, ...fullRest } = JSON.parse(JSON.stringify(PROTOCOL));
  assert.deepEqual(rest, fullRest, "The quick test's stimuli and timing must match the full test's");
  assert.deepEqual(staircase, { ...fullStaircase, catchEvery: 16, maxTrials: 80 }, "A quick staircase parameter changed: bump TEST_VERSION in src/core/protocol.ts.");
  assert.deepEqual(run, { stopReversals: 8, meanOfLast: 6 }, "The quick run changed: bump TEST_VERSION in src/core/protocol.ts.");
});

const session: Session = {
  page: "Form–Motion Coherence Test", testVersion: TEST_VERSION, testType: "full", seed: 1,
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

test("schema version 2: the export's fields are unchanged", () => {
  const out = exportObject(session);
  assert.equal(SCHEMA_VERSION, 2, "SCHEMA_VERSION changed: update the expected fields below to match");
  assert.equal(out.schema, "visual-tool/session");
  assert.equal(out.schema_version, 2);
  assert.equal(out.test_version, TEST_VERSION);
  assert.equal(out.test_type, "full");
  assert.deepEqual(Object.keys(out), [
    "schema", "schema_version", "test_version", "test_type", "page", "started_at", "finished_at", "ended_early", "seed",
    "settings", "protocol", "sensitivity_units", "calibration", "viewing_distance", "display", "environment",
    "contribution", "results", "trials",
  ], "The export's fields changed. Bump SCHEMA_VERSION in src/app/schema.ts and update its type.");
  assert.deepEqual(Object.keys(out.contribution ?? {}), ["contribute", "submission_id", "sent_at", "answers"], "Sending and removal state must not be exported");
  assert.equal(JSON.stringify(out).includes('"tasks"'), false, "In-memory staircases must not be exported");
});

test("a quick session is marked as quick, with the quick protocol, in its export and summary", () => {
  const quick: Session = { ...session, testType: "quick", settings: { ...session.settings, run: "quick" } };
  const out = exportObject(quick);
  assert.equal(out.test_type, "quick");
  assert.equal(out.settings.run, "quick");
  assert.deepEqual(out.protocol.parameters, QUICK_PROTOCOL);
  assert.equal(JSON.parse(summaryJSON(quick)).test_type, "quick");
});

test("trials CSV: one column per trial field, one row per trial", () => {
  const trial: Trial = {
    protocol: "clinic", task: "form", phase: "test", trial: 3, level_pct: 50, effective_level_pct: 49.8, target: "left", response: "right",
    correct: false, rt_ms: 640, reversal: true, frames: null, median_frame_ms: null, dropped_frames: null, display_ms: null,
    flash1_ms: 201, flash2_ms: 199, spiral_deg: 0, scale: 1, px_per_deg: 33, seed: 7, at: "2026-10-30T12:01:00.000Z",
  };
  assert.deepEqual([...CSV_COLUMNS].sort(), Object.keys(trial).sort(), "Every trial field is a CSV column");
  const [head, ...rows] = trialsCSV({ ...session, trials: [trial, trial] }).split("\n");
  assert.equal(head, CSV_COLUMNS.join(","));
  assert.equal(rows.length, 2);
  assert.equal(rows[0], "clinic,form,test,3,50,49.8,left,right,false,640,true,,,,,201,199,0,1,33,7,2026-10-30T12:01:00.000Z");
});
