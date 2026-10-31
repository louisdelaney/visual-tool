// Screen and eye geometry: pixels per degree, the blind-spot distance estimate, and fitting
// stimuli into the window.
import { CALIBRATION, PROTOCOL } from "./protocol";

const DEG = Math.PI / 180;

export function pxPerDeg(pxPerCm: number, distanceCm: number): number {
  return pxPerCm * distanceCm * Math.tan(DEG);
}

// Li et al. (2020): exact only when the eye is straight in front of the fixation square.
export function distanceFromBlindSpot(offsetCm: number, angleDeg: number = CALIBRATION.blindSpotDeg): number {
  return offsetCm / Math.tan(angleDeg * DEG);
}

// Off-axis version. squareCm and dotCm are horizontal screen positions relative to the foot of
// the perpendicular from the fixating eye. Solves atan(s/d) − atan(x/d) = α for d:
// tanα·d² − (s − x)·d + tanα·s·x = 0, taking the larger root. When s and x lie on the same side
// of the eye, a second root exists below √(s·x); it would mean fixating more than 45° off-axis,
// which no layout here asks for, so it is discarded. Null when no distance fits.
export function distanceFromBlindSpotGeometry(squareCm: number, dotCm: number, angleDeg: number = CALIBRATION.blindSpotDeg): number | null {
  const t = Math.tan(angleDeg * DEG), o = squareCm - dotCm;
  if (!(o > 0)) return null;
  const disc = o * o - 4 * t * t * squareCm * dotCm;
  return disc < 0 ? null : (o + Math.sqrt(disc)) / (2 * t);
}

export function angularExtentDeg(sizeCm: number, distanceCm: number): number {
  return 2 * Math.atan(sizeCm / (2 * distanceCm)) / DEG;
}

/** Scale (at most 1) that fits needW × needH degrees into the view, leaving margin pixels each side. */
export function fitScale(viewW: number, viewH: number, ppd: number, needW: number = PROTOCOL.field.w, needH: number = PROTOCOL.field.h, margin = 10): number {
  if (!(ppd > 0)) return 1;
  return Math.min(1, (viewW - 2 * margin) / (needW * ppd), (viewH - 2 * margin) / (needH * ppd));
}
