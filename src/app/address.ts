// Each info page has a real address, /privacy/ and so on, under wherever the site is hosted
// (/ locally, /visual-tool/ on GitHub Pages). The build writes a copy of the page at each one
// (see vite.config.ts), so they load directly, with no hash and no server rewrites.
import { INFO_PAGES, type InfoPage, type View } from "./types";

const isInfo = (page: string): page is InfoPage => (INFO_PAGES as readonly string[]).includes(page);

/** The site's own folder: the address with any info page's name taken off the end. */
const ROOT = window.location.pathname.replace(new RegExp(`(?:(?:${INFO_PAGES.join("|")})/?|index\\.html)$`), "");

/** The address of a page: its own folder for an info page, the site's for a step. */
export const pageHref = (view: View): string => (isInfo(view) ? `${ROOT}${view}/` : ROOT);

/** The info page the address names, or null. Old #privacy-style links still work. */
export function linkedPage(): InfoPage | null {
  const hash = window.location.hash.slice(1);
  if (isInfo(hash)) return hash;
  const page = window.location.pathname.slice(ROOT.length).replace(/\/$/, "");
  return isInfo(page) ? page : null;
}
