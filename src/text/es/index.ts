// The Spanish text: the same files as ../en/, each typed against the English so a missing or
// misnamed entry is an error in the file it belongs to. Loaded only at /es/ (see ../index.ts).
import { buildText } from "../wiring";
import type { Sources, Words } from "../words";
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

export const words: Words = { labels, common, site, contribute, setup, calibration, tasks, status, results, history, charts, pdf, infoPages, method };

export const sources: Sources = {
  site: siteMd, contribute: contributeMd, setup: setupMd, calibration: calibrationMd, tasks: tasksMd, results: resultsMd,
  history: historyMd, charts: chartsMd, pdf: pdfMd, privacy: privacyMd, references: referencesMd, data: dataMd,
};

export const es = buildText("es", words, sources);
