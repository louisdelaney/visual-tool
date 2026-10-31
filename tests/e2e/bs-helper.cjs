"use strict";
// Simulated viewer for the blind-spot check: centred head, left eye half an IPD left of centre,
// presses Space the moment the dot crosses 13.5° from the line of sight to the square.
// The layout rule is re-implemented here independently of the page.
const A = 13.5 * Math.PI / 180;
const PX_PER_CM = (85.6 * 96 / 25.4) / 85.6 * 10; // default card width, untouched slider

function layout(W) {
  const k = PX_PER_CM;
  const sq = Math.max(14, 0.5 * k), rad = Math.max(5, 0.35 * k);
  const edgeX = W - Math.max(sq * 2, 1.5 * k);
  const nearX = Math.min(edgeX, W / 2 + 3 * k);
  const lay = (nearX - rad - 4) / k < 24 ? "edge" : "centre";
  return { sqX: lay === "edge" ? edgeX : nearX, rad, lay, eyeX: W / 2 - 3.15 * k };
}

// seconds after the dot starts moving at which it reaches the blind spot
function pressDelay(W, D, headShiftCm = 0) {
  const k = PX_PER_CM, L = layout(W);
  const eyeTrue = L.eyeX + headShiftCm * k;
  const s = (L.sqX - eyeTrue) / k;
  const xb = eyeTrue + D * Math.tan(Math.atan(s / D) - A) * k;
  const x0 = Math.max(L.rad + 8, L.sqX - 4 * k);
  return { t: (x0 - xb) / (2 * k), lay: L.lay, squareDeg: Math.atan(s / D) * 180 / Math.PI };
}

async function runBlindSpot(p, D, headShiftCm = 0, sleep) {
  await p.click("#bs-start");
  await p.waitForFunction(() => !document.querySelector("#stage-msg").hidden);
  await sleep(150);
  await p.keyboard.press("Space");
  const info = [];
  for (let i = 0; i < 5; i++) {
    await p.waitForFunction(k => document.querySelector("#hud").textContent.startsWith(`Reading ${k} of`), i + 1, { timeout: 15000 });
    const W = await p.evaluate(() => window.innerWidth);
    const d = pressDelay(W, D, headShiftCm);
    info.push(d);
    await sleep(800 + d.t * 1000);
    await p.keyboard.press("Space");
  }
  await p.waitForFunction(() => document.querySelector("#stage").hidden, null, { timeout: 15000 });
  return info;
}

module.exports = { layout, pressDelay, runBlindSpot, PX_PER_CM };
