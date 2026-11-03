// Pins the test's parameters to TEST_VERSION, and the export's shape to SCHEMA_VERSION, so
// neither can change by accident. If one of these fails because you meant to change something,
// bump the version and update the expected values here.
import assert from "node:assert/strict";
import { test } from "vitest";
import { CALIBRATION, PROTOCOL, PROTOCOLS, QUICK_PROTOCOL, Staircase, TEST_VERSION } from "../../src/core";
import { exportObject, pastSummaryJSON, summaryJSON } from "../../src/app/export";
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
  startedAt: "2026-10-30T12:47:13.512Z", finishedAt: "2026-10-30T12:57:20.012Z", endedEarly: false,
  settings: { protocol: "clinic", motionDisplay: "brief", spiralDots: "flicker", order: "motion-first", run: "published" },
  calibration: { cardPx: 323.5, pxPerMm: 3.78, dpr: 2 },
  distance: { cm: 50, method: "manual", readings: [] },
  frameMs: 16.7, refreshHz: 60, display: { ppd0: 33, scale: 1, viewport: [1440, 900], fullscreen: true }, attempts: 0,
  env: { browser: "Chrome 131", device: "computer", viewport: [1440, 900], devicePixelRatio: 2 },
  tasks: { motion: { task: "motion", staircase: new Staircase(), trials: [], endedEarly: false } },
  trials: [], results: null,
  contribution: { contribute: true, submission_id: "abc", sent_at: null, sending: true, failed: false, delete_token: "secret", removal: "failed", answers: { pseudonym: null, age_range: null, perceptual_disorder: "no", condition: null, other_condition: null, diagnosed: null, psychedelics: "no", psychedelic_uses: null, months_since_psychedelics: null, psychedelics_used: null, takes_medication: null, medications: null, notes: null, found_via: null, found_via_other: null } },
};

test("schema version 3: the export's fields are unchanged", () => {
  const out = exportObject(session);
  assert.equal(SCHEMA_VERSION, 3, "SCHEMA_VERSION changed: update the expected fields below to match");
  assert.equal(out.schema, "visual-tool/session");
  assert.equal(out.schema_version, 3);
  assert.equal(out.test_version, TEST_VERSION);
  assert.equal(out.test_type, "full");
  assert.deepEqual(Object.keys(out), [
    "schema", "schema_version", "test_version", "test_type", "page", "started_at", "duration_s", "ended_early", "seed",
    "settings", "protocol", "sensitivity_units", "calibration", "viewing_distance", "display", "environment",
    "contribution", "results", "trials",
  ], "The export's fields changed. Bump SCHEMA_VERSION in src/app/schema.ts and update its type.");
  assert.deepEqual(Object.keys(out.contribution ?? {}), ["contribute", "submission_id", "answers"], "Sending and removal state must not be exported");
  assert.deepEqual(Object.keys(out.contribution?.contribute ? out.contribution.answers : {}), [
    "pseudonym", "age_range", "perceptual_disorder", "condition", "other_condition", "diagnosed", "psychedelics", "psychedelic_uses", "months_since_psychedelics",
    "psychedelics_used", "takes_medication", "medications", "notes", "found_via", "found_via_other",
  ], "The answers changed. Bump SCHEMA_VERSION in src/app/schema.ts and update its type.");
  assert.deepEqual(Object.keys(out.environment), ["browser", "device", "viewport", "devicePixelRatio"]);
});

test("the export holds no exact times: the start's hour and the duration only", () => {
  // An old saved card measurement can carry the time it was taken; it isn't exported.
  const out = exportObject({ ...session, calibration: { ...session.calibration!, measuredAt: "2026-10-28T09:13:00.000Z" } as Session["calibration"] });
  assert.equal(out.started_at, "2026-10-30T12:00:00.000Z");
  assert.equal(out.duration_s, 607);
  assert.deepEqual(Object.keys(out.calibration ?? {}), ["cardPx", "pxPerMm", "dpr"]);
  assert.equal(exportObject({ ...session, finishedAt: null }).duration_s, null);
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

test("summary: the same file from the session just run and from its export, with how it was taken", () => {
  const fromSession = JSON.parse(summaryJSON(session));
  assert.deepEqual(JSON.parse(pastSummaryJSON(exportObject(session))), fromSession);
  assert.deepEqual(Object.keys(fromSession), ["about", "pseudonym", "started_at", "test_version", "test_type", "answers", "results", "taken_on", "staircases"]);
  assert.deepEqual(Object.keys(fromSession.taken_on), ["device", "viewing_distance_cm", "full_screen"]);
  assert.equal(typeof fromSession.results.easy_checks_missed, "number");
  assert.equal(fromSession.started_at, exportObject(session).started_at, "the summary has the hour only, like the export");
});
