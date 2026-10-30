"use strict";
// Layout: no horizontal scrolling at phone and desktop widths, in light and dark, with the settings
// open and on the example results; no page errors. Screenshots go to tests/output.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { PAGE_URL, OUT } = require("./paths.js");

fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errors = [], failures = [];
  for (const vw of [360, 400, 1440]) {
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 860 }, colorScheme: scheme });
      const p = await ctx.newPage();
      p.on("pageerror", e => errors.push(`${vw}px ${scheme}: ${e.message}`));
      await p.goto(PAGE_URL); await p.waitForTimeout(400);
      await p.click("#settings summary"); await p.waitForTimeout(150);
      const setupOverflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      await p.screenshot({ path: path.join(OUT, `layout-setup-${vw}-${scheme}.png`), fullPage: true });
      await p.click("#simulate"); await p.waitForTimeout(300);
      const resultsOverflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      await p.screenshot({ path: path.join(OUT, `layout-results-${vw}-${scheme}.png`), fullPage: true });
      console.log(`${vw}px ${scheme}: horizontal overflow on setup ${setupOverflow > 0}, on results ${resultsOverflow > 0}`);
      if (setupOverflow > 0 || resultsOverflow > 0) failures.push(`${vw}px ${scheme} scrolls horizontally`);
      if (vw === 1440 && scheme === "light") console.log("  example tiles:", await p.$$eval(".tile", els => els.map(e => e.innerText.replace(/\n+/g, " | "))));
      await ctx.close();
    }
  }
  console.log("\nERRORS:", errors.length ? errors : "none", "\nFAILURES:", failures.length ? failures : "none");
  await browser.close();
  if (errors.length || failures.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
