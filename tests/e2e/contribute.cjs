"use strict";
// Contributing, from the page to a backend: builds the site pointed at the backend, takes the whole
// test as a simulated participant who answers Yes to contributing, then reads what the backend
// stored and checks it against what the page exported, and that the page talked to nothing but
// its own site and that backend.
//
// Which backend, from the environment or .env.local:
//   E2E_API_URL        unset: the test starts the backend here, in memory, with its data in a
//                      temporary folder. No server or Docker needed.
//                      Set: that backend, normally compose.yaml's backend-e2e, which uses its own
//                      Firestore database (e2e) so the backend's data is never touched:
//                      http://backend-e2e:8080 in compose's e2e service, http://<server>:8082
//                      from another machine.
//   E2E_FIRESTORE_URL  with E2E_API_URL, the Firestore emulator it uses, to read what was
//                      stored: http://firestore:8081, or http://<server>:8081.
// The page is served at http://localhost:4173, the origin backend-e2e allows.
// Usage: node tests/e2e/contribute.cjs
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const net = require("node:net");
const { execFileSync, spawn } = require("node:child_process");
const { chromium } = require("playwright");
const { runBlindSpot } = require("./bs-helper.cjs");
const { OUT, ROOT, serve } = require("./paths.cjs");

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const PAGE_PORT = 4173;
const PROJECT = "demo-visual-tool";
const DATABASE = "e2e"; // backend-e2e's FIRESTORE_DATABASE
const PSEUDONYM = `e2e-${Date.now().toString(36)}`;

// NAME from the environment, else from .env.local.
function setting(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n").filter(l => l.startsWith(`${name}=`)).pop();
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}
const REMOTE_API = setting("E2E_API_URL").replace(/\/+$/, "");
const FIRESTORE = setting("E2E_FIRESTORE_URL").replace(/\/+$/, "");

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer().once("error", reject).listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Starts the backend here, in memory, persisted to dataFile. Resolves { url, stop }.
async function localBackend(tmp, dataFile) {
  const installed = ["esbuild", "typescript", "@google-cloud/firestore"].every(m => fs.existsSync(path.join(ROOT, "backend", "node_modules", m)));
  if (!installed) execFileSync("npm", ["--prefix", "backend", "ci"], { cwd: ROOT, stdio: "inherit" });
  execFileSync("npm", ["--prefix", "backend", "run", "--silent", "build"], { cwd: ROOT, stdio: "inherit" });
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(ROOT, "backend", "dist", "server.js")], {
    cwd: tmp,
    env: { ...process.env, BACKEND: "memory", DATA_FILE: dataFile, ALLOWED_ORIGIN: `http://localhost:${PAGE_PORT}`, PORT: String(port), EXPORT_DIR: path.join(tmp, "export"), GOOGLE_CLOUD_PROJECT: "", K_SERVICE: "" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  return { url: `http://127.0.0.1:${port}`, stop: () => child.kill() };
}

async function waitFor(url, ms = 60000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(500)) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
  }
  throw new Error(`${url} didn't answer: is backend-e2e running? (npm run backend:up)`);
}

// A stored session as { fields, body }: the stored record's field names and its gunzipped body.
// From the emulator's REST API for a remote backend, or from the data file for a local one.
async function storedSession(id, dataFile) {
  let rec, gz;
  if (dataFile) {
    rec = JSON.parse(fs.readFileSync(dataFile, "utf8")).sessions[id];
    gz = rec?.body_gzip;
  } else {
    const r = await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/${DATABASE}/documents/sessions/${id}`);
    rec = r.ok ? (await r.json()).fields : null;
    gz = rec?.body_gzip?.bytesValue;
  }
  return rec ? { fields: Object.keys(rec).sort(), body: zlib.gunzipSync(Buffer.from(gz, "base64")).toString("utf8") } : null;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "visual-tool-e2e-"));
  let server = null, browser = null, local = null;
  const errors = [], failures = [];
  const check = (ok, msg) => { if (!ok) failures.push(msg); };
  try {
    if (REMOTE_API && !FIRESTORE) throw new Error("E2E_API_URL is set but E2E_FIRESTORE_URL isn't: the test can't read what was stored");
    const dataFile = REMOTE_API ? null : path.join(tmp, "sessions.json");
    if (!REMOTE_API) local = await localBackend(tmp, dataFile);
    const API = REMOTE_API || local.url;
    log(REMOTE_API ? `contribute: backend ${API}, emulator ${FIRESTORE}, database ${DATABASE}` : `contribute: backend here, in memory, at ${API}`);
    await waitFor(`${API}/groups`);
    const before = await (await fetch(`${API}/groups`)).json();

    // The site, built with this backend's address (the build's Content Security Policy allows only it).
    const dist = path.join(tmp, "dist");
    execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir", "--logLevel", "warn"], { cwd: ROOT, stdio: "inherit", env: { ...process.env, VITE_API_URL: API } });
    server = await serve(dist, PAGE_PORT);
    const origin = new URL(server.url).origin;

    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    p.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
    p.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    const apiRequests = [];
    p.on("request", r => {
      const u = new URL(r.url());
      if (u.protocol === "blob:" || u.protocol === "data:" || u.origin === origin) return;
      if (u.origin !== new URL(API).origin) { failures.push(`request to ${u.origin}`); return; }
      apiRequests.push(r);
    });

    // Contribute: Yes, with answers to every question that has one.
    await p.goto(server.url); await sleep(300);
    await p.check('#contrib-form input[name="contribute"][value="yes"]');
    await p.fill("#cq-pseudonym", PSEUDONYM);
    await p.click("#contrib-go"); await sleep(150);
    await p.check('#questions-form input[name="disorder"][value="no"]');
    await p.check('#questions-form input[name="psychedelics"][value="yes"]');
    await p.fill("#cq-uses", "5");
    for (const drug of ["LSD", "psilocybin"]) { await p.fill("#cq-psychedelics-used", drug); await p.press("#cq-psychedelics-used", "Enter"); }
    await p.check('#questions-form input[name="medication"][value="no"]');
    await p.fill("#cq-notes", "end-to-end test");
    await p.click("#questions-go"); await sleep(150);
    check(await p.$eval('[data-view="setup"]', el => !el.hidden), "Continue on the Contribute step didn't lead to setup");

    // Know each trial's answer, through the page's Core, so the observer can be right as often as a person would.
    await p.evaluate(() => {
      const om = Core.mulberry32;
      Core.mulberry32 = seed => { const r = om(seed); let first = true; return () => { const v = r(); if (first) { first = false; window.__first = v; window.__coh = 0; } return v; }; };
      const OU = Core.UpDownMotion; Core.UpDownMotion = class extends OU { constructor(o) { super(o); window.__coh = o.coherence; } };
      const og = Core.glassFrame; Core.glassFrame = o => { window.__coh = Math.max(window.__coh || 0, o.coherence); return og(o); };
    });
    await p.click("#start"); await sleep(150);
    await p.click("#screen-next"); await sleep(150);
    await runBlindSpot(p, 50, 0, sleep);
    await p.click("#distance-next"); await sleep(300);

    // Simulated observer: 2AFC Weibull with lapses, thresholds in coherence %.
    const alphas = { motion: 8, form: 20 };
    const pc = (c, a) => 0.5 + 0.48 * (1 - Math.exp(-Math.pow(c / a, 2.2)));
    let rs = 7;
    const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
    const KINDS = [
      { prefix: "Up:", pick: f => (f < 0.5 ? "up" : "down"), keys: { up: "ArrowUp", down: "ArrowDown" }, other: { up: "down", down: "up" } },
      { prefix: "First flash:", pick: f => (f < 0.5 ? "1" : "2"), keys: { "1": "1", "2": "2" }, other: { "1": "2", "2": "1" } },
    ];
    async function runTask(name) {
      await p.click("#task-start");
      for (;;) {
        const st = await p.evaluate(() => ({ open: !document.querySelector("#stage").hidden, msg: !document.querySelector("#stage-msg").hidden, hud: document.querySelector("#hud").textContent, first: window.__first, coh: window.__coh }));
        if (!st.open) return;
        if (st.msg) { await p.keyboard.press("Space"); await sleep(60); continue; }
        const kind = KINDS.find(k => st.hud.startsWith(k.prefix));
        if (!kind) { await sleep(30); continue; }
        const target = kind.pick(st.first);
        await p.keyboard.press(kind.keys[rnd() < pc(st.coh * 100, alphas[name]) ? target : kind.other[target]]);
        await p.waitForFunction(pre => !document.querySelector("#hud").textContent.startsWith(pre), kind.prefix, { timeout: 8000 });
      }
    }
    const t0 = Date.now();
    await runTask("motion");
    await runTask("form");
    log(`contribute: tasks took ${((Date.now() - t0) / 1000).toFixed(0)} s`);

    // The page sends the session when the results appear.
    await p.waitForFunction(() => /Sent anonymously|Couldn't send/.test(document.querySelector("#contrib-note")?.textContent ?? ""), null, { timeout: 15000 });
    const note = await p.$eval("#contrib-note", el => el.textContent);
    log("contribute: results page says:", note);
    check(note.startsWith("Sent anonymously"), `the page says: ${note}`);
    const id = /Reference: ([0-9a-f-]{36})/.exec(note)?.[1];
    await p.screenshot({ path: path.join(OUT, "contribute-results.png"), fullPage: true });
    await p.evaluate(() => document.fullscreenElement ? document.exitFullscreen() : null); await sleep(300);
    await p.click("#copy-json"); await sleep(250);
    const exported = JSON.parse(await p.$eval("#raw-json", el => el.value));
    const userAgent = await p.evaluate(() => navigator.userAgent);

    // Exactly one POST, carrying no cookies and no referrer.
    const posts = apiRequests.filter(r => r.method() === "POST");
    check(posts.length === 1, `${posts.length} POSTs to the backend, not 1`);
    for (const r of apiRequests) {
      const h = await r.allHeaders();
      check(!h.cookie && !h.referer, `${r.method()} ${new URL(r.url()).pathname} sent ${h.cookie ? "a cookie" : "a referrer"}`);
    }

    // What the backend stored: the session as sent, and nothing about the request.
    const stored = id ? await storedSession(id, dataFile) : null;
    check(!!stored, `no stored session for reference ${id}`);
    if (stored) {
      check(JSON.stringify(stored.fields) === JSON.stringify(["body_gzip", "received_at", "schema_version", "test_version"]), `the stored session has fields ${stored.fields}`);
      const raw = stored.body;
      const body = JSON.parse(raw);
      check(!raw.includes(userAgent), "the stored session contains the browser's user agent");
      check(body.schema === exported.schema && body.schema_version === exported.schema_version && body.test_version === exported.test_version, "stored versions differ from the export");
      check(JSON.stringify(body.trials) === JSON.stringify(exported.trials), "stored trials differ from the export");
      check(JSON.stringify(body.results) === JSON.stringify(exported.results), "stored results differ from the export");
      const a = body.contribution?.answers ?? {};
      log("contribute: stored answers:", JSON.stringify(a));
      check(JSON.stringify(a) === JSON.stringify(exported.contribution?.answers), "stored answers differ from the export");
      check(a.pseudonym === PSEUDONYM && a.psychedelics === "yes" && a.psychedelic_uses === 5 && JSON.stringify(a.psychedelics_used) === JSON.stringify(["LSD", "psilocybin"]) && a.notes === "end-to-end test",
        "the stored answers aren't the ones typed in");
    }

    // The backend serves it back: the person's history, and one more in the used-psychedelics group.
    const history = await (await fetch(`${API}/history?pseudonym=${PSEUDONYM}`)).json();
    check(history.sessions?.length === 1 && history.sessions[0].submission_id === id, `history for ${PSEUDONYM} isn't this one session`);
    const after = await (await fetch(`${API}/groups`)).json();
    const complete = exported.results.motion?.status === "complete" && exported.results.form?.status === "complete";
    log(`contribute: group sizes: control ${before.groups.control.n} → ${after.groups.control.n}, used psychedelics ${before.groups.psychedelics.n} → ${after.groups.psychedelics.n} (both thresholds reached: ${complete})`);
    check(after.groups.control.n === before.groups.control.n, "the control group changed");
    check(after.groups.psychedelics.n === before.groups.psychedelics.n + (complete ? 1 : 0), "the used-psychedelics group didn't count the session");
    await ctx.close();
  } catch (e) {
    errors.push(String((e && e.stack) || e));
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
    if (local) local.stop();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  log("\nERRORS:", errors.length ? errors : "none", "\nFAILURES:", failures.length ? failures : "none");
  if (errors.length || failures.length) process.exitCode = 1;
})();
