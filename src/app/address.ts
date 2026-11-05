// Each info page has a real address, /privacy/ and so on, under wherever the site is hosted
// (/ locally, /visual-tool/ on GitHub Pages), and each language but English has its own folder
// there: /es/, /es/privacy/. The build writes a copy of the page at each one (see
// vite.config.ts), so they load directly, with no hash and no server rewrites.
import { INFO_PAGES, type InfoPage, type View } from "./types";
import { OTHER_LANGUAGES, type Language } from "../text/languages";

const isInfo = (page: string): page is InfoPage => (INFO_PAGES as readonly string[]).includes(page);

// The address in three parts: the site's own folder, then a language's folder, then an info page.
const PARTS = new RegExp(`^(.*?/)(?:(${OTHER_LANGUAGES.join("|")})(?:/|$))?(?:(?:${INFO_PAGES.join("|")})/?|index\\.html)?$`).exec(window.location.pathname);

/** The site's own folder, whatever the language. */
const SITE = PARTS?.[1] ?? window.location.pathname;

/** The language the address asks for: English at the site's own address, Spanish under /es/. */
export const LANGUAGE: Language = (PARTS?.[2] as Language | undefined) ?? "en";

const rootOf = (language: Language): string => (language === "en" ? SITE : `${SITE}${language}/`);

/** This language's folder: the address with any info page's name taken off the end. */
const ROOT = rootOf(LANGUAGE);

/** The address of a page: its own folder for an info page, the site's for a step. */
export const pageHref = (view: View): string => (isInfo(view) ? `${ROOT}${view}/` : ROOT);

/** The same page in another language. A step has no address of its own, so that's the language's home page. */
export const languageHref = (language: Language, view: View): string => (isInfo(view) ? `${rootOf(language)}${view}/` : rootOf(language));

/** The info page the address names, or null. Old #privacy-style links still work. */
export function linkedPage(): InfoPage | null {
  const hash = window.location.hash.slice(1);
  if (isInfo(hash)) return hash;
  const page = window.location.pathname.slice(ROOT.length).replace(/\/$/, "");
  return isInfo(page) ? page : null;
}
