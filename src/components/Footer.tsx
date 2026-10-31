import { TEST_VERSION } from "../core";
import { show } from "../app/flow";

export function Footer() {
  return (
    <footer className="foot">
      <p>
        Test version {TEST_VERSION} · Just for fun, not medical advice · All contributed data is public and anonymous ·{" "}
        <a href="#privacy" onClick={e => { e.preventDefault(); show("privacy"); }}>Privacy and risks</a> ·{" "}
        <a href="#references" onClick={e => { e.preventDefault(); show("references"); }}>Method and references</a>
      </p>
    </footer>
  );
}
