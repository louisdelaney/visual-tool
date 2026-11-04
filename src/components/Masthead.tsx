// Links to the other pages, the title, and where you are in the test.
import type { ReactNode } from "react";
import { INFO_PAGES, type View } from "../app/types";
import { goHome, show, showHistory } from "../app/flow";
import { pageHref } from "../app/address";
import { Stepper } from "./Stepper";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.site;

/** `notice` goes above the steps: the "just for fun" notice on the home and Results pages. */
export function Masthead({ view, notice = null }: { view: View; notice?: ReactNode }) {
  const onInfo = (INFO_PAGES as readonly View[]).includes(view);
  return (
    <header className="masthead">
      <nav className="site-nav" aria-label={t.nav.label}>
        <a href={pageHref("contribute")} aria-current={view === "contribute" || view === "questions" ? "page" : undefined} onClick={e => { e.preventDefault(); if (view !== "contribute") goHome(); }}>{t.nav.home}</a>
        <a href={pageHref("history")} aria-current={view === "history" ? "page" : undefined} onClick={e => { e.preventDefault(); showHistory(); }}>{t.nav.history}</a>
        <a href={pageHref("privacy")} aria-current={view === "privacy" ? "page" : undefined} onClick={e => { e.preventDefault(); show("privacy"); }}>{t.nav.privacy}</a>
        <a href={pageHref("references")} aria-current={view === "references" ? "page" : undefined} onClick={e => { e.preventDefault(); show("references"); }}>{t.nav.references}</a>
        <a href={pageHref("data")} aria-current={view === "data" ? "page" : undefined} onClick={e => { e.preventDefault(); show("data"); }}>{t.nav.data}</a>
      </nav>
      <h1>{t.title}</h1>
      <p className="lede"><Rich text={t.lede} /></p>
      {notice}
      {!onInfo && <Stepper view={view} />}
    </header>
  );
}
