// Devices: anything with a mouse or trackpad is a computer; touch-only devices are tablets if
// their screen is big enough for the tasks, and phones otherwise.
import assert from "node:assert/strict";
import { test } from "vitest";
import { MIN_TOUCH_SCREEN_PX, deviceKind } from "../../src/app/device";

test("device: a mouse or trackpad makes it a computer, whatever the screen", () => {
  assert.equal(deviceKind(false, 1440, 900), "computer");
  assert.equal(deviceKind(false, 360, 640), "computer");
});

test("device: touch-only screens are phones below the minimum and tablets from it, either way round", () => {
  for (const [w, h] of [[375, 812], [430, 932], [412, 915], [600, 960]]) {
    assert.equal(deviceKind(true, w!, h!), "phone", `${w}×${h}`);
    assert.equal(deviceKind(true, h!, w!), "phone", `${h}×${w}`);
  }
  for (const [w, h] of [[744, 1133], [810, 1080], [1024, 1366], [800, 1280]]) {
    assert.equal(deviceKind(true, w!, h!), "tablet", `${w}×${h}`);
    assert.equal(deviceKind(true, h!, w!), "tablet", `${h}×${w}`);
  }
  assert.equal(deviceKind(true, MIN_TOUCH_SCREEN_PX, 1000), "tablet");
  assert.equal(deviceKind(true, MIN_TOUCH_SCREEN_PX - 1, 1000), "phone");
});
