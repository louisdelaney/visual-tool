"use strict";
// Where the page and the test output live.
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(ROOT, "index.html");

module.exports = {
  ROOT,
  PAGE,
  PAGE_URL: pathToFileURL(PAGE).href,
  OUT: path.join(__dirname, "output"), // screenshots from the end-to-end tests; ignored by git
};
