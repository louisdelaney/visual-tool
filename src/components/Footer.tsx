import { TEST_VERSION } from "../core";
import { show } from "../app/flow";
import { pageHref } from "../app/address";

export function Footer() {
  return (
    <footer className="foot">
      <p>
        Test version {TEST_VERSION} · Just for fun, not medical advice · All contributed data is public and anonymous ·{" "}
        <a href={pageHref("privacy")} onClick={e => { e.preventDefault(); show("privacy"); }}>Privacy and risks</a> ·{" "}
        <a href={pageHref("references")} onClick={e => { e.preventDefault(); show("references"); }}>Method and references</a> ·{" "}
        <a href={pageHref("data")} onClick={e => { e.preventDefault(); show("data"); }}>Data</a>
      </p>
    </footer>
  );
}
