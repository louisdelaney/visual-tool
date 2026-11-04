// The words for how a run was taken (RunInfo in history.ts), on both results pages and in the PDF.
// Kept apart from history.ts so the backend, which imports that, doesn't depend on the site's text.
import type { RunInfo } from "./history";
import { fmt } from "./format";
import { text } from "../text";

/** The sentence both results pages show when easy check trials were answered wrongly. */
export const missedChecksText = (missed: number): string => text.history.run.missedChecks(missed);

/** "Computer · 55 cm away · full screen", leaving out what wasn't recorded. */
export function takenOn(run: RunInfo): string {
  const t = text.history.run;
  const parts = [t.device[run.device]];
  if (run.distance_cm != null) parts.push(t.distance(fmt.fixed(run.distance_cm, 0)));
  if (run.fullscreen != null) parts.push(run.fullscreen ? t.fullScreen : t.notFullScreen);
  return parts.join(t.separator);
}
