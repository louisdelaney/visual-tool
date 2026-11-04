// What's collected, who can see what, and the risks of taking part. The words are in
// src/text/en/privacy.md. Keep them accurate: if the app or the backend starts collecting or
// logging anything new, that page must say so.
import { back } from "../app/flow";
import { text } from "../text";
import { Doc } from "../text/Doc";

export function PrivacyPage() {
  return (
    <section className="view view-stack" data-view="privacy" aria-labelledby="privacy-h">
      <div className="panel prose">
        <Doc blocks={text.infoPages.privacy} titleId="privacy-h" />
      </div>
      <div className="actions"><button type="button" className="btn secondary back" onClick={back}>{text.common.back}</button></div>
    </section>
  );
}
