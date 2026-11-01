// Links to the other pages, the title, and where you are in the test.
import { INFO_PAGES, type View } from "../app/types";
import { goHome, show, showHistory } from "../app/flow";
import { pageHref } from "../app/address";
import { Stepper } from "./Stepper";

export function Masthead({ view }: { view: View }) {
  const onInfo = (INFO_PAGES as readonly View[]).includes(view);
  return (
    <header className="masthead">
      <nav className="site-nav" aria-label="Pages">
        <a href={pageHref("contribute")} aria-current={view === "contribute" || view === "questions" ? "page" : undefined} onClick={e => { e.preventDefault(); if (view !== "contribute") goHome(); }}>Home</a>
        <a href={pageHref("history")} aria-current={view === "history" ? "page" : undefined} onClick={e => { e.preventDefault(); showHistory(); }}>User results</a>
        <a href={pageHref("privacy")} aria-current={view === "privacy" ? "page" : undefined} onClick={e => { e.preventDefault(); show("privacy"); }}>Privacy and risks</a>
        <a href={pageHref("references")} aria-current={view === "references" ? "page" : undefined} onClick={e => { e.preventDefault(); show("references"); }}>Method and references</a>
        <a href={pageHref("data")} aria-current={view === "data" ? "page" : undefined} onClick={e => { e.preventDefault(); show("data"); }}>Data</a>
      </nav>
      <h1>Form–Motion Coherence Test</h1>
      <p className="lede">
        Two short tasks from vision research. Each finds your coherence threshold, the smallest share of organised dots you can still pick out from random ones. One task uses moving dots, the other a pattern hidden among random dots.
      </p>
      {!onInfo && <Stepper view={view} />}
    </header>
  );
}
