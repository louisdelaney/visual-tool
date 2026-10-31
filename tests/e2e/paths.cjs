"use strict";
// Where the built site and the test output live, and a static server for the build: ES module
// scripts don't load from file:// URLs, so the tests open the page over HTTP.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const DIST = path.join(ROOT, "dist");
const OUT = path.join(__dirname, "..", "output"); // screenshots from the end-to-end tests; ignored by git
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };

// Serves dist/ on a free port. Resolves { url, close }. Run `npm run build` first.
function serve() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error("dist/ has no build: run `npm run build` first");
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    const file = path.join(DIST, rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => {
    resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise(r => server.close(r)) });
  }));
}

module.exports = { ROOT, DIST, OUT, serve };
