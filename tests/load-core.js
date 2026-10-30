"use strict";
// Runs the page's inline script in Node and returns its Core module: protocol, stimuli, staircase
// and geometry. The app half of the script only starts when a document exists, so no DOM is needed,
// and the tests always exercise the code in index.html rather than a copy.
const fs = require("node:fs");
const { PAGE } = require("./paths.js");

const scripts = [...fs.readFileSync(PAGE, "utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 1) throw new Error(`Expected one inline <script> in index.html, found ${scripts.length}`);

const mod = { exports: {} };
new Function("module", "exports", scripts[0])(mod, mod.exports);
module.exports = mod.exports;
