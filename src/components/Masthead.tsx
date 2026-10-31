// The title, the "just for fun" notice, links to the other pages, and the steps.
import { INFO_PAGES, type View } from "../app/types";
import { goHome, show, showHistory } from "../app/flow";
import { Stepper } from "./Stepper";

export function Masthead({ view }: { view: View }) {
  const onInfo = (INFO_PAGES as readonly View[]).includes(view);
  return (
    <header className="masthead">
      <p className="eyebrow">Just for fun · Not medical advice</p>
      <h1>Form–Motion Coherence Test</h1>
      <p className="lede">
        Two short tasks from vision research. Each finds your coherence threshold, the smallest share of organised dots you can still pick out from random ones. One task uses moving dots, the other a pattern hidden among random dots.
      </p>
      <nav className="site-nav" aria-label="Pages">
        <a href="./" aria-current={view === "contribute" ? "page" : undefined} onClick={e => { e.preventDefault(); if (view !== "contribute") goHome(); }}>Home</a>
        <a href="#history" aria-current={view === "history" ? "page" : undefined} onClick={e => { e.preventDefault(); showHistory(); }}>User results</a>
        <a href="#privacy" aria-current={view === "privacy" ? "page" : undefined} onClick={e => { e.preventDefault(); show("privacy"); }}>Privacy and risks</a>
        <a href="#references" aria-current={view === "references" ? "page" : undefined} onClick={e => { e.preventDefault(); show("references"); }}>Method and references</a>
      </nav>
      {!onInfo && <Stepper view={view} />}
    </header>
  );
}
