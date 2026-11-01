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

// Serves a build (dist/ unless another folder is given) at http://127.0.0.1:<a free port>/, or at
// http://localhost:<port>/ when a port is given, to match a backend's allowed origin.
// Resolves { url, close }. Run `npm run build` first.
function serve(DIST = module.exports.DIST, port = 0) {
  if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error(`${path.relative(ROOT, DIST)}/ has no build: run \`npm run build\` first`);
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    let file = path.join(DIST, rel);
    // A folder serves its index.html, as GitHub Pages does: /privacy/ is dist/privacy/index.html.
    if (file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => server.once("error", reject).listen(port, "127.0.0.1", () => {
    resolve({ url: `http://${port ? "localhost" : "127.0.0.1"}:${server.address().port}/`, close: () => new Promise(r => server.close(r)) });
  }));
}

module.exports = { ROOT, DIST, OUT, serve };
