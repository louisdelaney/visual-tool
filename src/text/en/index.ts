// The English text: its words (the .ts files) and its paragraphs (the .md files), one of each per
// page or part of the site, built into what the pages read by ../wiring.
import { buildText } from "../wiring";
import { labels } from "./labels";
import { common } from "./common";
import { site } from "./site";
import { contribute } from "./contribute";
import { setup } from "./setup";
import { calibration } from "./calibration";
import { tasks } from "./tasks";
import { status } from "./status";
import { results } from "./results";
import { history } from "./history";
import { charts } from "./charts";
import { pdf } from "./pdf";
import { infoPages } from "./infoPages";
import { method } from "./method";
import siteMd from "./site.md";
import contributeMd from "./contribute.md";
import setupMd from "./setup.md";
import calibrationMd from "./calibration.md";
import tasksMd from "./tasks.md";
import resultsMd from "./results.md";
import historyMd from "./history.md";
import chartsMd from "./charts.md";
import pdfMd from "./pdf.md";
import privacyMd from "./privacy.md";
import referencesMd from "./references.md";
import dataMd from "./data.md";

/** Every entry in the .ts files, by file. Each translation has the same ones (../words.ts). */
export const words = { labels, common, site, contribute, setup, calibration, tasks, status, results, history, charts, pdf, infoPages, method };

/** The Markdown files' text, by file name. */
export const sources = {
  site: siteMd, contribute: contributeMd, setup: setupMd, calibration: calibrationMd, tasks: tasksMd, results: resultsMd,
  history: historyMd, charts: chartsMd, pdf: pdfMd, privacy: privacyMd, references: referencesMd, data: dataMd,
};

export const en = buildText("en", words, sources);
