// What kind of device this is, for whether it can run the tasks. A touch screen with no mouse or
// trackpad is a phone or a tablet. The tasks need about 10 cm of screen each way (11° at 50 cm),
// which a phone can't show at full size, so phones can't take the test at all. A tablet with a big
// enough screen can, as long as it stands still. Worked out in the browser; a contributed session
// records only the kind, computer or tablet.
import type { DeviceKind } from "./types";

/**
 * The shortest screen side, in CSS pixels, a touch device needs to run the tasks. Phones are 320 to
 * 480, and 7-inch tablets 600 (about 9.5 cm, just short of what the tasks need). An iPad mini is 744.
 */
export const MIN_TOUCH_SCREEN_PX = 700;

/** Sorts a device by its pointer and its screen size in CSS pixels. */
export function deviceKind(touchOnly: boolean, screenW: number, screenH: number): DeviceKind {
  if (!touchOnly) return "computer";
  return Math.min(screenW, screenH) >= MIN_TOUCH_SCREEN_PX ? "tablet" : "phone";
}

/** This device's kind. A tablet with a trackpad counts as a computer. */
export function thisDevice(): DeviceKind {
  const touchOnly = window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches;
  return deviceKind(touchOnly, window.screen.width, window.screen.height);
}
