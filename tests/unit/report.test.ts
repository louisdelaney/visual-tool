// The PDF summaries: groups are only ever those of the session's own test type and version, the
// site's WOFF fonts unpack to TrueType, and a summary of one session or many builds into a PDF.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "vitest";
import { PDFDocument } from "pdf-lib";
import { TEST_VERSION } from "../../src/core/protocol";
import { SAMPLE_GROUPS, type GroupsResponse } from "../../src/app/comparison";
import { sampleHistory } from "../../src/app/history";
import { reportEntry, reportGroups, type Report } from "../../src/app/report";
import { buildSummaryPDF, type Fonts } from "../../src/app/pdf";
import { woffToSfnt } from "../../src/app/woff";

const FONTS = "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin";
const fonts = (): Fonts => ({ regular: fs.readFileSync(`${FONTS}-400-normal.woff`), bold: fs.readFileSync(`${FONTS}-700-normal.woff`) });

const QUICK: GroupsResponse = { ...SAMPLE_GROUPS, test_type: "quick" };
const ready = (stats: GroupsResponse) => ({ state: "ready" as const, stats, sample: false });

test("report: a session is only ever shown beside groups of its own type and version", () => {
  assert.equal(reportGroups(ready(SAMPLE_GROUPS), "full", TEST_VERSION).state, "ready");
  assert.equal(reportGroups(ready(SAMPLE_GROUPS), "quick", TEST_VERSION).state, "unavailable");
  assert.equal(reportGroups(ready(QUICK), "full", TEST_VERSION).state, "unavailable");
  assert.equal(reportGroups(ready({ ...SAMPLE_GROUPS, test_version: TEST_VERSION - 1 }), "full", TEST_VERSION).state, "unavailable");
  assert.equal(reportGroups(ready(SAMPLE_GROUPS), "full", TEST_VERSION - 1).state, "none", "an earlier version is never shown beside groups");
  assert.equal(reportGroups({ state: "loading" }, "full", TEST_VERSION).state, "unavailable");
  assert.equal(reportGroups(null, "full", TEST_VERSION).state, "none", "no groups on a copy without a backend");
});

test("woff: unpacks to a TrueType font with the same tables", async () => {
  const woff = fs.readFileSync(`${FONTS}-400-normal.woff`);
  const ttf = await woffToSfnt(woff);
  const dv = new DataView(ttf.buffer, ttf.byteOffset, ttf.byteLength);
  assert.equal(dv.getUint32(0), new DataView(woff.buffer, woff.byteOffset).getUint32(4), "same flavour");
  assert.equal(dv.getUint16(4), woff.readUInt16BE(12), "same number of tables");
  await assert.rejects(woffToSfnt(new Uint8Array(64)), /Not a WOFF/);
});

test("pdf: one session, and several, build into A4 pages", async () => {
  const history = sampleHistory("quiet-heron");
  const groups = { full: ready(SAMPLE_GROUPS), quick: { state: "error" as const } };
  const sessions = [...history.sessions].reverse().map(e => reportEntry(e, groups));
  const reports: Report[] = [{ pseudonym: null, sessions: sessions.slice(0, 1) }, { pseudonym: history.pseudonym, sessions }];
  for (const report of reports) {
    const bytes = await buildSummaryPDF(report, fonts());
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    assert.ok(doc.getPageCount() >= report.sessions.length, "each session starts its own page");
    assert.ok(doc.getPages().every(p => Math.round(p.getWidth()) === 595 && Math.round(p.getHeight()) === 842), "A4");
    assert.match(doc.getTitle() ?? "", /^Form–Motion Coherence Test/);
    assert.equal(doc.getCreationDate(), undefined, "no time saved in the file");
  }
});
