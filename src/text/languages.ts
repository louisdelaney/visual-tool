// The languages the site is in. English is at the site's own address; every other language is in
// a folder named after it, so Spanish is at /es/ and its privacy page at /es/privacy/. The address
// alone picks the language: nothing is stored, and nothing about it is sent.
//
// Plain data with no imports, so vite.config.ts can read it to write each language's copies of
// the page. To add a language: add it here, add its folder beside en/ and es/, and add it to
// OTHERS in index.ts.
export const LANGUAGES = {
  /**
   * `name` is what the link to this language says, in its own words. `title` is the test's name in
   * it: the heading on every page, the browser tab and the PDF all read it from here, so it's
   * written once. (The name saved in exported data is PAGE_NAME in app/protocol.ts, always English.)
   */
  en: { name: "English", title: "Form–Motion Coherence Test" },
  es: { name: "Español", title: "Prueba de coherencia de forma y movimiento" },
} satisfies Record<string, { name: string; title: string }>;

export type Language = keyof typeof LANGUAGES;

/** Every language but English, which needs no folder. */
export const OTHER_LANGUAGES = (Object.keys(LANGUAGES) as Language[]).filter(l => l !== "en");
