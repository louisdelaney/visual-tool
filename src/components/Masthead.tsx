// Links to the other pages, the title, and where you are in the test.
import type { ReactNode } from "react";
import { INFO_PAGES, type View } from "../app/types";
import { goHome, show, showHistory } from "../app/flow";
import { LANGUAGE, languageHref, pageHref } from "../app/address";
import { getState } from "../app/store";
import { Stepper } from "./Stepper";
import { text } from "../text";
import { LANGUAGES, type Language } from "../text/languages";
import { Rich } from "../text/Rich";

const t = text.site;

/** The languages the page isn't in, each a link to this page in it. */
const OTHERS = (Object.keys(LANGUAGES) as Language[]).filter(l => l !== LANGUAGE);

/** Another language is another page, so a test under way starts again there: ask before leaving one. */
const leaveForLanguage = (e: { preventDefault(): void }): void => {
  if (getState().session && !window.confirm(text.status.changeLanguage)) e.preventDefault();
};

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
        {OTHERS.map(l => <a key={l} className="lang" href={languageHref(l, view)} lang={l} hrefLang={l} onClick={leaveForLanguage}>{LANGUAGES[l].name}</a>)}
      </nav>
      <h1>{t.title}</h1>
      <p className="lede"><Rich text={t.lede} /></p>
      {notice}
      {!onInfo && <Stepper view={view} />}
    </header>
  );
}
