// All the words on the site. The English is in en/, one file per page or part of the site, and each
// other language (languages.ts) has a folder of the same files: plain words in the .ts files and
// paragraphs in the .md files. wiring/ builds them into `text`, which the components read, so
// wording can change without touching layout or logic.
// Inline formatting inside a sentence is written as tags: see tags.ts and Rich.tsx.
import { en } from "./en";
import { sealMarkdown } from "./markdown";
import type { buildText } from "./wiring";
import type { Language } from "./languages";

/** What the pages read: the same shape in every language, built by wiring/. */
export type Text = ReturnType<typeof buildText>;

/** The site's words, in English until loadLanguage says otherwise. */
export let text: Text = en;

// Every Markdown block is read by now; one read later, inside a function, would only fail when
// that function first ran, so it throws straight away instead (and the unit tests call them all).
sealMarkdown();

/** The other languages, each loaded only when its address is opened. */
const OTHERS: Record<Exclude<Language, "en">, () => Promise<Text>> = {
  es: async () => (await import("./es")).es,
};

/**
 * Makes `text` the words of this language. Most modules read their words as they load, so this
 * must finish before any of them is imported: main.tsx calls it, then loads the app.
 */
export async function loadLanguage(language: Language): Promise<void> {
  if (language === "en") return;
  text = await OTHERS[language]();
  sealMarkdown();
}
