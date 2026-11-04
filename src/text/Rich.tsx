// Shows a sentence from src/text with its tags as elements: <strong>, <em> and <kbd> as
// themselves, a link to one of the site's pages (<privacy-link> and the rest of PAGE_LINKS) as a
// link to it, and any other hyphenated tag by the functions in `tags`, which can also replace how
// a page link is shown. Every paragraph from a Markdown file is shown through this, so its
// formatting always works.
import { Fragment, type ReactNode } from "react";
import { PAGE_LINKS, parseTags, type PageLink, type TagNode } from "./tags";
import { pageHref } from "../app/address";

export type TagRenderer = (children: ReactNode) => ReactNode;

// The flow is loaded on the click rather than with this file, so code that only formats text (the
// PDF, the unit tests) doesn't load the stage and everything else the flow needs.
const pageLink = (page: PageLink): TagRenderer => c => (
  <a href={pageHref(page)} onClick={e => {
    e.preventDefault();
    void import("../app/flow").then(flow => (page === "history" ? flow.showHistory() : flow.show(page)));
  }}>{c}</a>
);

const BUILT_IN: Record<string, TagRenderer> = {
  strong: c => <strong>{c}</strong>,
  em: c => <em>{c}</em>,
  kbd: c => <kbd>{c}</kbd>,
  code: c => <code>{c}</code>,
  ...Object.fromEntries(PAGE_LINKS.map(page => [`${page}-link`, pageLink(page)])),
};

function render(nodes: (string | TagNode)[], tags: Record<string, TagRenderer>, hrefs: string[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (typeof n === "string") return n;
    if (n.tag === "web-link") {
      // A whole page's link to a web address, which opens in a new tab: the next address in order.
      const href = hrefs.shift();
      if (!href) throw new Error("A <web-link> with no address");
      return <a key={i} href={href} target="_blank" rel="noopener noreferrer">{render(n.children, tags, hrefs)}</a>;
    }
    const as = tags[n.tag] ?? BUILT_IN[n.tag];
    if (!as) throw new Error(`No element given for <${n.tag}>`);
    return <Fragment key={i}>{as(render(n.children, tags, hrefs))}</Fragment>;
  });
}

/** `hrefs` are the web addresses of the sentence's <web-link>s, in order (Words in markdown.ts). */
export function Rich({ text, tags = {}, hrefs = [] }: { text: string; tags?: Record<string, TagRenderer>; hrefs?: readonly string[] }) {
  return <>{render(parseTags(text), tags, [...hrefs])}</>;
}
