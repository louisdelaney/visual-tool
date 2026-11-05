// Puts a language's words where the pages read them. The words themselves are plain text in each
// language's folder (en/, es/): quoted text in the .ts files, paragraphs in the .md files. This
// folder is the code that goes with them, written once for every language: it reads each Markdown
// block by name, fills {values} into a sentence, picks between a sentence's variants ("1 session",
// "2 sessions"), and hands the shared labels to each place that shows them.
//
// To add a piece of text: add its words to the English and to each translation, then one line here.
import { LANGUAGES, type Language } from "../languages";
import { markdown } from "../markdown";
import type { Sources, Words } from "../words";
import { common } from "./common";
import { site } from "./site";
import { contribute } from "./contribute";
import { setup } from "./setup";
import { calibration } from "./calibration";
import { tasks } from "./tasks";
import { results } from "./results";
import { history } from "./history";
import { charts } from "./charts";
import { pdf } from "./pdf";
import { infoPages } from "./infoPages";

/** Everything the pages, the test screens and the PDF read, built from one language's words and Markdown. */
export function buildText(language: Language, w: Words, sources: Sources) {
  type BlockFile = Exclude<keyof Sources, "privacy" | "references" | "data">;
  const md = (file: BlockFile) => markdown(sources[file], `${language}/${file}.md`);
  /** The test's name in this language. */
  const name = LANGUAGES[language].title;
  const header = site(w, md("site"), name);
  const byPseudonym = history(w, md("history"));
  return {
    common: common(w),
    site: header,
    contribute: contribute(w, md("contribute")),
    setup: setup(w, md("setup")),
    calibration: calibration(w, md("calibration")),
    tasks: tasks(w, md("tasks")),
    status: w.status,
    results: results(w, md("results")),
    history: byPseudonym,
    charts: charts(w, md("charts")),
    pdf: pdf(w, md("pdf"), name, { funNotice: header.funNotice, practice: byPseudonym.practice, quickNote: byPseudonym.quickNote, earlierVersion: byPseudonym.earlierVersion }),
    infoPages: infoPages(w, sources, language),
    method: w.method,
  };
}
