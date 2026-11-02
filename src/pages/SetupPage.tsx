// Step 2: what the tasks look like, the full or quick test, and what you need.
import { useState } from "react";
import type { TestType } from "../core";
import type { Session } from "../app/types";
import { show } from "../app/flow";
import { getState, setState } from "../app/store";
import { useWindowSize } from "../hooks";
import { StimulusPreview } from "../components/StimulusPreview";

/** About how long the whole visit takes, card and viewing distance included. */
const MINUTES: Record<TestType, number> = { full: 10, quick: 5 };

interface SetupPageProps {
  testType: TestType;
  session: Session | null;
}

export function SetupPage({ testType, session }: SetupPageProps) {
  const [playing, setPlaying] = useState(true);
  const { w } = useWindowSize();
  // A session keeps the test type it started with: once a task has run, the choice is fixed.
  const locked = !!session && Object.keys(session.tasks).length > 0;
  const chosen = locked ? session.testType : testType;
  const pick = (v: TestType): void => setState(session ? { testType: v, session: null } : { testType: v });

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
          <figcaption><strong>Form.</strong> Two quick flashes of flickering dots. In one, some line up into a starburst. You say which flash.</figcaption>
        </figure>
      </div>
      <p className="caption">Both examples are at 100% coherence. In the test, the share of organised dots falls until it's hard to tell.</p>

      <fieldset id="test-type">
        <legend>Full or quick test</legend>
        <label className="opt">
          <input type="radio" name="test-type" value="full" id="test-type-full" checked={chosen === "full"} disabled={locked} onChange={() => pick("full")} />
          <span><strong>Full test</strong>, about {MINUTES.full} minutes. Each task runs as long as in the published studies it's based on.</span>
        </label>
        <label className="opt">
          <input type="radio" name="test-type" value="quick" id="test-type-quick" checked={chosen === "quick"} disabled={locked} onChange={() => pick("quick")} />
          <span><strong>Quick test</strong>, about {MINUTES.quick} minutes. Each task runs for about half as long, so the results are less precise. They're only ever compared with other quick-test results.</span>
        </label>
        {locked && <p className="small-note">You've started the {chosen} test, so this stays as it is until you start again.</p>}
      </fieldset>

      <h3>Before you start</h3>
      <ul className="checklist">
        <li>A laptop or desktop with a keyboard. Phones and tablets won't work.</li>
        <li>A bank card, or any card the same size, to measure your screen.</li>
        <li>About {MINUTES[chosen]} minutes in a dim room, sitting about an arm's length (50 cm) from the screen.</li>
        <li>Your usual glasses or contact lenses.</li>
      </ul>
      <p className="notice"><strong>Please read.</strong> This is just for fun and isn't medical advice. The tasks show moving and flickering dots: don't run them if you have photosensitive epilepsy, and press Esc to stop if they make you feel unwell. If you chose to contribute, your results are sent anonymously when you finish. Otherwise they stay in this browser unless you save or copy them.</p>
      {w < 760 && <p className="small-note">This window is too small to run the tasks. Open the page on a laptop or desktop and maximise the window.</p>}

      <div className="actions">
        <button type="button" className="btn" id="start" onClick={() => show("screen")}>Start</button>
        <button type="button" className="btn secondary back" id="setup-back" onClick={() => show(getState().contribution?.contribute ? "questions" : "contribute")}>Back</button>
      </div>
    </section>
  );
}
