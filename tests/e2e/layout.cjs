"use strict";
// Layout: no horizontal scrolling at phone and desktop widths, in light and dark, on step 1 with
// every question open, on the set-up step and on the info pages (the results page is checked by
// full.cjs after a real run); phones kept from the test and tablets warned; no page
// errors; and no request to any server but the site itself. Screenshots go to tests/output.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { OUT, serve } = require("./paths.cjs");

fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const server = await serve();
  const PAGE_URL = server.url;
  const browser = await chromium.launch();
  const errors = [], failures = [];
  // Each language has its own folder (src/text/languages.ts), English at the site's own address.
  // Translated words run longer, so every width is checked in each.
  const languages = [
    { lang: "en", folder: "", file: "", title: "Form–Motion Coherence Test", other: `${PAGE_URL}es/` },
    { lang: "es", folder: "es/", file: "-es", title: "Prueba de coherencia de forma y movimiento", other: PAGE_URL },
  ];
  for (const language of languages) {
    const HOME = `${PAGE_URL}${language.folder}`;
    for (const vw of [360, 400, 1440]) {
      for (const scheme of ["light", "dark"]) {
        const ctx = await browser.newContext({ viewport: { width: vw, height: 860 }, colorScheme: scheme });
        const p = await ctx.newPage();
        const at = `${language.lang} ${vw}px ${scheme}`;
        p.on("pageerror", e => errors.push(`${at}: ${e.message}`));
        // The page promises it contacts nothing but itself: fonts, scripts and all are served from the site.
        p.on("request", r => { const u = new URL(r.url()); if (u.protocol !== "blob:" && u.protocol !== "data:" && u.origin !== new URL(PAGE_URL).origin) failures.push(`${at}: request to ${u.origin}`); });
        p.on("console", m => { if (m.type() === "error") errors.push(`${at} console: ${m.text()}`); });
        await p.goto(HOME); await p.waitForTimeout(400);
        // The address alone picks the language: the page says which it is, in its own words, and links to the other.
        const shown = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, h1: document.querySelector("h1")?.textContent, other: document.querySelector(".site-nav a.lang")?.getAttribute("href") }));
        if (shown.lang !== language.lang || shown.title !== language.title || shown.h1 !== language.title) failures.push(`${at}: the ${language.lang} home page shows lang "${shown.lang}", title "${shown.title}", heading "${shown.h1}"`);
        if (!shown.other || new URL(shown.other, HOME).href !== language.other) failures.push(`${at}: the link to the other language goes to ${shown.other}`);
        // Step 1's questions with every follow-up open, the longest the form gets.
        await p.check('#contrib-form input[name="contribute"][value="yes"]');
        await p.click("#contrib-go"); await p.waitForTimeout(150);
        for (const v of ["disorder", "psychedelics", "medication"]) await p.check(`#questions-form input[name="${v}"][value="yes"]`);
        await p.check("#cq-other"); await p.waitForTimeout(150);
        const contribOverflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        await p.screenshot({ path: path.join(OUT, `layout-contribute${language.file}-${vw}-${scheme}.png`), fullPage: true });
        await p.click("#questions-back"); await p.waitForTimeout(150);
        await p.check('#contrib-form input[name="contribute"][value="no"]');
        await p.click("#contrib-go"); await p.waitForTimeout(300);
        const setupOverflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        await p.screenshot({ path: path.join(OUT, `layout-setup${language.file}-${vw}-${scheme}.png`), fullPage: true });
        const pageOverflow = {};
        for (const page of ["privacy", "references", "history"]) {
          await p.goto(`${HOME}${page}/`); await p.waitForTimeout(300);
          pageOverflow[page] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          if (!(await p.$(`[data-view="${page}"]`))) failures.push(`${at}: ${language.folder}${page}/ didn't open the ${page} page`);
          await p.screenshot({ path: path.join(OUT, `layout-${page}${language.file}-${vw}-${scheme}.png`), fullPage: true });
        }
        console.log(`${at}: horizontal overflow on contribute ${contribOverflow > 0}, on setup ${setupOverflow > 0}, on ${Object.entries(pageOverflow).map(([k, v]) => `${k} ${v > 0}`).join(", ")}`);
        if (Object.values(pageOverflow).some(v => v > 0)) failures.push(`${at}: an info page scrolls horizontally`);
        if (contribOverflow > 0 || setupOverflow > 0) failures.push(`${at} scrolls horizontally`);
        await ctx.close();
      }
    }
  }
  // Touch-only devices: a phone can't start the test but can open the other pages; a large tablet
  // can, with a warning to stand it still. A desktop window at phone width is still a computer.
  const devices = [
    { name: "phone", viewport: { width: 390, height: 844 }, kind: "phone" },
    { name: "small tablet", viewport: { width: 960, height: 600 }, kind: "phone" },
    { name: "tablet", viewport: { width: 1180, height: 820 }, kind: "tablet" },
  ];
  for (const dv of devices) {
    const ctx = await browser.newContext({ viewport: dv.viewport, screen: dv.viewport, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on("pageerror", e => errors.push(`${dv.name}: ${e.message}`));
    await p.goto(PAGE_URL); await p.waitForTimeout(400);
    const seen = await p.evaluate(() => ({ phone: !!document.querySelector("#device-phone"), tablet: !!document.querySelector("#device-tablet"), form: !!document.querySelector("#contrib-form") }));
    await p.screenshot({ path: path.join(OUT, `layout-device-${dv.name.replace(" ", "-")}.png`), fullPage: true });
    if (dv.kind === "phone") {
      if (!seen.phone || seen.form) failures.push(`${dv.name}: the home page offers the test`);
      await p.click("#history-open"); await p.waitForTimeout(200);
      if (!(await p.$('[data-view="history"]'))) failures.push(`${dv.name}: previous results didn't open`);
    } else {
      if (!seen.tablet || !seen.form || seen.phone) failures.push(`${dv.name}: no tablet warning, or no form`);
      await p.check('#contrib-form input[name="contribute"][value="no"]');
      await p.click("#contrib-go"); await p.waitForTimeout(300);
      if (await p.$eval("#start", b => b.disabled)) failures.push(`${dv.name}: Start is disabled on a sideways tablet`);
    }
    console.log(`${dv.name}: ${JSON.stringify(seen)}`);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 860 } });
    const p = await ctx.newPage();
    await p.goto(PAGE_URL); await p.waitForTimeout(400);
    if (await p.$("#device-phone, #device-tablet")) failures.push("narrow desktop window: shown a device notice");
    await p.check('#contrib-form input[name="contribute"][value="no"]');
    await p.click("#contrib-go"); await p.waitForTimeout(300);
    if (!(await p.$eval("#start", b => b.disabled))) failures.push("narrow desktop window: Start is enabled");
    await ctx.close();
  }

  console.log("\nERRORS:", errors.length ? errors : "none", "\nFAILURES:", failures.length ? failures : "none");
  await browser.close();
  await server.close();
  if (errors.length || failures.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
