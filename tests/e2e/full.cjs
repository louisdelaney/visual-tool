"use strict";
// Full runs with a simulated observer: drives the real page in headless Chromium through screen size,
// blind-spot distance and both tasks, then checks the results, the data export and the stimulus
// timing. Screenshots go to tests/output.
// Usage: node tests/e2e/full.cjs [late]
//   late: answer motion trials 300 ms after the dots appear, instead of the moment they appear.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { runBlindSpot } = require("./bs-helper.cjs");
const { OUT, serve } = require("./paths.cjs");

fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const late = process.argv.includes("late");
const OLD_KEY = "form-motion-coherence/v1";

(async () => {
  const server = await serve();
  const PAGE_URL = server.url;
  const browser = await chromium.launch();
  const errors = [], failures = [];
  const check = (ok, msg) => { if (!ok) failures.push(msg); };
  const watch = (p, tag) => {
    p.on("pageerror", e => errors.push(`${tag} pageerror: ${e.message}`));
    p.on("console", m => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|net::|ERR_/.test(m.text())) errors.push(`${tag} console: ${m.text()}`); });
  };

  async function fullRun(protocol, alphas) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // A browser that ran an older version may have test settings saved, from when there were options.
    // Seed that before the page loads: the page must ignore it.
    await ctx.addInitScript(key => {
      try {
        if (!localStorage.getItem("seeded")) {
          localStorage.setItem("seeded", "1");
          localStorage.setItem(key, JSON.stringify({ settings: { protocol: "atkinson", motionDisplay: "until-answer", order: "form-first" } }));
        }
      } catch (e) { /* storage blocked */ }
    }, OLD_KEY);
    const p = await ctx.newPage(); watch(p, protocol);
    await p.goto(PAGE_URL); await sleep(500);
    const seeded = await p.evaluate(key => localStorage.getItem(key) || "", OLD_KEY);
    check(seeded.includes("until-answer"), `[${protocol}] could not seed the old saved setting, so that check didn't run`);
    // Test hooks: record each trial's target (the first rng() draw) and coherence through Core.
    await p.evaluate(() => {
      const om = Core.mulberry32;
      Core.mulberry32 = seed => { const r = om(seed); let first = true; return () => { const v = r(); if (first) { first = false; window.__first = v; window.__coh = 0; } return v; }; };
      const OU = Core.UpDownMotion; Core.UpDownMotion = class extends OU { constructor(o) { super(o); window.__coh = o.coherence; } };
      const og = Core.glassFrame; Core.glassFrame = o => { window.__coh = Math.max(window.__coh || 0, o.coherence); return og(o); };
    });
    await p.check('#contrib-form input[name="contribute"][value="no"]');
    await p.click("#contrib-go"); await sleep(150);
    check(!(await p.$("#settings")) && !(await p.$('input[name="protocol"]')), "[clinic] setup still offers test settings");
    await p.screenshot({ path: path.join(OUT, `full-setup-${protocol}.png`), fullPage: true });
    await p.click("#start"); await sleep(150);
    await p.click("#screen-next"); await sleep(150);
    await runBlindSpot(p, 50, 0, sleep);
    log(`[${protocol}]`, await p.$eval("#distance-result", el => el.textContent), "|", await p.$eval("#fit", el => el.textContent));
    await p.click("#distance-next"); await sleep(300);
    await p.screenshot({ path: path.join(OUT, `full-intro-motion-${protocol}.png`), fullPage: true });

    // Simulated observer: 2AFC Weibull with lapses; alphas are in coherence %.
    const pc = (c, a) => 0.5 + 0.48 * (1 - Math.exp(-Math.pow(c / a, 2.2)));
    let rs = 2024;
    const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
    const KINDS = [
      { prefix: "Up:", pick: f => (f < 0.5 ? "up" : "down"), keys: { up: "ArrowUp", down: "ArrowDown" }, other: { up: "down", down: "up" } },
      { prefix: "First flash:", pick: f => (f < 0.5 ? "1" : "2"), keys: { "1": "1", "2": "2" }, other: { "1": "2", "2": "1" } },
    ];

    async function catchFlash(file) {
      // poll the canvas until spiral dots are on screen, then screenshot
      for (let i = 0; i < 400; i++) {
        const lit = await p.evaluate(() => {
          const c = document.querySelector("#stage-canvas"), k = c.getContext("2d"), w = c.width, h = c.height;
          const d = k.getImageData(Math.round(w / 2 - 150), Math.round(h / 2 - 150), 300, 300).data;
          let n = 0; for (let j = 0; j < d.length; j += 4) if (d[j] > 200 && d[j + 1] > 200) n++;
          return n;
        });
        if (lit > 200) { await p.screenshot({ path: path.join(OUT, file) }); return lit; }
        await sleep(5);
      }
      return 0;
    }

    async function runTask(name) {
      await p.click("#task-start");
      let trials = 0, shot = false, paused = false, flashShot = false;
      for (;;) {
        const st = await p.evaluate(() => ({ open: !document.querySelector("#stage").hidden, msg: !document.querySelector("#stage-msg").hidden, hud: document.querySelector("#hud").textContent, first: window.__first, coh: window.__coh }));
        if (!st.open) break;
        if (st.msg) {
          await p.keyboard.press("Space"); await sleep(60);
          if (protocol === "clinic" && name === "form" && !flashShot) { flashShot = true; log(`  [${protocol}/form] lit pixels in captured flash: ${await catchFlash("full-flash-clinic.png")}`); }
          continue;
        }
        const kind = KINDS.find(k => st.hud.startsWith(k.prefix));
        if (kind) {
          if (!shot && trials === 12) { await p.screenshot({ path: path.join(OUT, `full-trial-${name}-${protocol}.png`) }); shot = true; }
          if (!paused && trials === 15) {
            paused = true;
            await p.keyboard.press("Escape"); await sleep(250);
            const shown = await p.$eval("#pause", el => !el.hidden);
            log(`  [${protocol}/${name}] pause shown: ${shown}`);
            check(shown, `[${protocol}/${name}] Esc didn't pause`);
            await p.click("#pause-resume"); await sleep(150);
            continue;
          }
          if (late && kind.prefix === "Up:") await sleep(300);
          const target = kind.pick(st.first);
          const correct = rnd() < pc(st.coh * 100, alphas[name]);
          await p.keyboard.press(kind.keys[correct ? target : kind.other[target]]);
          trials++;
          await p.waitForFunction(pre => !document.querySelector("#hud").textContent.startsWith(pre), kind.prefix, { timeout: 8000 });
          continue;
        }
        await sleep(30);
      }
      log(`  [${protocol}/${name}] responses: ${trials}`);
    }

    const t0 = Date.now();
    await runTask("motion");
    await p.screenshot({ path: path.join(OUT, `full-intro-form-${protocol}.png`), fullPage: true });
    await runTask("form");
    log(`  [${protocol}] tasks took ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    await sleep(300);
    check(await p.$eval('[data-view="results"]', el => !el.hidden), `[${protocol}] results didn't follow the tasks`);
    await p.screenshot({ path: path.join(OUT, `full-results-${protocol}.png`), fullPage: true });
    log("  tiles:", await p.$$eval(".tile", els => els.map(e => e.innerText.replace(/\n+/g, " | "))));
    log("  meta:", (await p.$$eval("#meta dt, #meta dd", els => els.map(e => e.textContent))).join(" ; "));
    // The results at phone width: no horizontal scrolling. Leave full screen first, or the window can't resize.
    await p.evaluate(() => document.fullscreenElement ? document.exitFullscreen() : null); await sleep(300);
    await p.setViewportSize({ width: 360, height: 860 }); await sleep(300);
    check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `[${protocol}] results scroll horizontally at 360px`);
    await p.screenshot({ path: path.join(OUT, `full-results-360-${protocol}.png`), fullPage: true });
    await p.setViewportSize({ width: 1440, height: 900 }); await sleep(300);

    await p.click("#copy-json"); await sleep(250);
    const data = JSON.parse(await p.$eval("#raw-json", el => el.value));
    check(data.contribution && data.contribution.contribute === false && !data.contribution.answers, `[${protocol}] choosing No should record no answers`);
    const by = {};
    for (const t of data.trials) { const k = t.task + ":" + t.phase; by[k] = (by[k] || 0) + 1; }
    log("  phases:", JSON.stringify(by), "| unique seeds", new Set(data.trials.map(t => t.seed)).size, "of", data.trials.length);
    log("  results:", JSON.stringify({ motion: data.results.motion && { thr: data.results.motion.threshold_pct, sens: data.results.motion.sensitivity }, form: data.results.form && { thr: data.results.form.threshold_pct, sens: data.results.form.sensitivity }, diff: data.results.motion_minus_form }));
    for (const task of ["motion", "form"]) {
      const r = data.results[task];
      check(r && r.status === "complete" && Number.isFinite(r.threshold_pct), `[${protocol}] no complete ${task} threshold`);
    }
    check(data.trials.every(t => t.correct === (t.target === t.response)), `[${protocol}] a trial's "correct" field disagrees with its target and response`);
    check(data.settings.protocol === protocol, `[${protocol}] export says protocol ${data.settings.protocol}`);

    if (protocol === "clinic") {
      const fl = data.trials.flatMap(t => [t.flash1_ms, t.flash2_ms]).filter(Number.isFinite);
      const md = data.trials.filter(t => t.task === "motion" && t.display_ms != null).map(t => t.display_ms).sort((a, b) => a - b);
      const motion = data.trials.filter(t => t.task === "motion");
      log("  spiral flash ms: n", fl.length, "min", Math.min(...fl), "max", Math.max(...fl));
      log("  motion display ms: n", md.length, "min", md[0], "median", md[md.length >> 1], "max", md[md.length - 1], "| median rt", motion.map(t => t.rt_ms).sort((a, b) => a - b)[motion.length >> 1]);
      log("  export settings:", JSON.stringify(data.settings), "| test_version:", data.test_version, "| schema_version:", data.schema_version);
      check(data.schema === "visual-tool/session" && data.schema_version === 1 && data.test_version === 1, `[clinic] export versions wrong: ${data.schema} ${data.schema_version} ${data.test_version}`);
      // 200 ms targets, allowing one late frame from a busy headless machine
      check(fl.length > 0 && Math.min(...fl) >= 195 && Math.max(...fl) <= 240, `[clinic] spiral flashes ran ${Math.min(...fl)}-${Math.max(...fl)} ms`);
      check(md.length === motion.length && md[0] >= 195 && md[md.length - 1] <= 240, `[clinic] motion displays ran ${md[0]}-${md[md.length - 1]} ms`);
      check(data.settings.motionDisplay === "brief" && data.settings.order === "motion-first", `[clinic] an old saved setting leaked into the session: ${JSON.stringify(data.settings)}`);
      check(!(await p.evaluate(() => !!document.querySelector('input[name="motionDisplay"]'))), "[clinic] setup still offers a motion display option");
    }
    await ctx.close();
  }

  await fullRun("clinic", { motion: 8, form: 20 });
  log("\nERRORS:", errors.length ? errors : "none", "\nFAILURES:", failures.length ? failures : "none");
  await browser.close();
  await server.close();
  if (errors.length || failures.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
