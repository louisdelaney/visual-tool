"use strict";
// Viewing distance: a simulated viewer does the blind-spot check across window sizes, distances and
// head positions, and the page's estimate must land within 3% of the true distance (it reports
// whole centimetres). Screenshots go to tests/output.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { runBlindSpot, PX_PER_CM } = require("./bs-helper.cjs");
const { OUT, serve } = require("./paths.cjs");

fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TOLERANCE = 0.03;

(async () => {
  const server = await serve();
  const PAGE_URL = server.url;
  const browser = await chromium.launch();
  const scenarios = [
    { name: "13.3in laptop, arm's length", w: 1085, h: 680, D: 72 },
    { name: "15.6in laptop, arm's length", w: 1304, h: 733, D: 75 },
    { name: "narrow window (edge layout)", w: 900, h: 640, D: 42 },
    { name: "small window", w: 1000, h: 700, D: 45 },
    { name: "laptop-size", w: 1440, h: 900, D: 50 },
    { name: "ultrawide", w: 3440, h: 1440, D: 70 },
    { name: "ultrawide, head 5 cm right", w: 3440, h: 1440, D: 70, shift: 5 },
    { name: "ultrawide, half-width window", w: 1720, h: 1300, D: 65, screen: { width: 3440, height: 1440 } },
  ];
  const errors = [], failures = [];
  for (const sc of scenarios) {
    const ctx = await browser.newContext({ viewport: { width: sc.w, height: sc.h }, screen: sc.screen || { width: sc.w, height: sc.h } });
    const p = await ctx.newPage();
    p.on("pageerror", e => errors.push(`${sc.name}: ${e.message}`));
    await p.goto(PAGE_URL); await sleep(300);
    await p.check('#contrib-form input[name="contribute"][value="no"]');
    await p.click("#contrib-go"); await sleep(100);
    await p.click("#start"); await sleep(100);
    await p.click("#screen-next"); await sleep(150);
    const note = await p.$eval("#window-note", el => el.hidden ? "(none)" : el.textContent);
    const info = await runBlindSpot(p, sc.D, sc.shift || 0, sleep);
    const res = await p.$eval("#distance-result", el => el.textContent);
    const fit = await p.$eval("#fit", el => el.textContent);
    const match = /(\d+(\.\d+)?) cm/.exec(res);
    const est = match ? parseFloat(match[1]) : NaN;
    const err = est / sc.D - 1;
    console.log(`\n[${sc.name}] ${(sc.w / PX_PER_CM).toFixed(0)} cm wide, true ${sc.D} cm, layout ${info[0].lay}, square ${info[0].squareDeg.toFixed(1)}° off-axis`);
    console.log("  page:", res);
    console.log("  fit:", fit);
    console.log("  window note:", note);
    console.log(`  error ${(100 * err).toFixed(1)}%`);
    if (!(Math.abs(err) <= TOLERANCE)) failures.push(`${sc.name}: estimate ${est} cm for a true ${sc.D} cm`);
    if (sc.name === "ultrawide" || sc.name.startsWith("13.3in")) {
      await p.click("#bs-start"); await p.waitForFunction(() => !document.querySelector("#stage-msg").hidden); await sleep(100);
      await p.keyboard.press("Space"); await p.waitForFunction(() => document.querySelector("#hud").textContent.startsWith("Reading 1"));
      await sleep(2500);
      await p.screenshot({ path: path.join(OUT, sc.name.startsWith("13.3in") ? "blindspot-laptop.png" : "blindspot-ultrawide.png") });
      await p.keyboard.press("Escape");
    }
    await ctx.close();
  }
  console.log("\nERRORS:", errors.length ? errors : "none", "\nFAILURES:", failures.length ? failures : "none");
  await browser.close();
  await server.close();
  if (errors.length || failures.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
