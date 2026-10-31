// Step 2: what the tasks look like and what you need.
import { useState } from "react";
import { show } from "../app/flow";
import { useWindowSize } from "../hooks";
import { StimulusPreview } from "../components/StimulusPreview";

export function SetupPage() {
  const [playing, setPlaying] = useState(true);
  const { w } = useWindowSize();

  return (
    <section className="view panel" data-view="setup" aria-labelledby="setup-h">
      <h2 id="setup-h">What you'll see</h2>
      <div className="previews">
        <figure>
          <StimulusPreview kind="motion" seed={101} playing={playing} id="pv-motion" label="Animated example of the motion task" />
          <figcaption>
            <strong>Motion.</strong> Some of the dots drift together, up or down. You say which way.{" "}
            <button type="button" className="linkish" id="pv-play" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
          </figcaption>
        </figure>
        <figure>
          <StimulusPreview kind="form" seed={202} playing={playing} id="pv-form" label="Example of the form task" />
          <figcaption><strong>Form.</strong> Two quick flashes of flickering dots. In one, some line up into a spiral. You say which flash.</figcaption>
        </figure>
      </div>
      <p className="caption">Both examples are at 100% coherence. In the test, the share of organised dots falls until it's hard to tell.</p>

      <h3>Before you start</h3>
      <ul className="checklist">
        <li>A laptop or desktop with a keyboard. Phones and tablets won't work.</li>
        <li>A bank card, or any card the same size, to measure your screen.</li>
        <li>About 10 minutes in a dim room, sitting about an arm's length (50 cm) from the screen.</li>
        <li>Your usual glasses or contact lenses.</li>
      </ul>
      <p className="notice"><strong>Please read.</strong> This is just for fun and isn't medical advice. The tasks show moving and flickering dots: don't run them if you have photosensitive epilepsy, and press Esc to stop if they make you feel unwell. If you chose to contribute, your results are sent anonymously when you finish. Otherwise they stay in this browser unless you save or copy them.</p>
      {w < 760 && <p className="small-note">This window is too small to run the tasks. Open the page on a laptop or desktop and maximise the window.</p>}

      <div className="actions">
        <button type="button" className="btn" id="start" onClick={() => show("screen")}>Start</button>
        <button type="button" className="btn secondary back" id="setup-back" onClick={() => show("contribute")}>Back</button>
      </div>
    </section>
  );
}
