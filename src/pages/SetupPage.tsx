// Step 2: what the tasks look like, the full or quick test, and what you need.
import { useState } from "react";
import type { TestType } from "../core";
import type { Session } from "../app/types";
import { show } from "../app/flow";
import { getState, setState } from "../app/store";
import { thisDevice } from "../app/device";
import { useWindowSize } from "../hooks";
import { StimulusPreview } from "../components/StimulusPreview";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.setup;

/** The narrowest window the tasks run in. */
const MIN_WINDOW_W = 760;

/** About how long the whole visit takes, card and viewing distance included. */
const MINUTES: Record<TestType, number> = { full: 10, quick: 5 };

interface SetupPageProps {
  testType: TestType;
  session: Session | null;
}

export function SetupPage({ testType, session }: SetupPageProps) {
  const [playing, setPlaying] = useState(true);
  const { w } = useWindowSize();
  const tablet = thisDevice() === "tablet";
  const tooNarrow = w < MIN_WINDOW_W;
  // A session keeps the test type it started with: once a task has run, the choice is fixed.
  const locked = !!session && Object.keys(session.tasks).length > 0;
  const chosen = locked ? session.testType : testType;
  const pick = (v: TestType): void => setState(session ? { testType: v, session: null } : { testType: v });

  return (
    <section className="view panel" data-view="setup" aria-labelledby="setup-h">
      <h2 id="setup-h">{t.heading}</h2>
      <div className="previews">
        <figure>
          <StimulusPreview kind="motion" seed={101} playing={playing} id="pv-motion" label={t.motionPreviewLabel} />
          <figcaption>
            <Rich text={t.motionCaption} />{" "}
            <button type="button" className="linkish" id="pv-play" onClick={() => setPlaying(!playing)}>{playing ? t.pause : t.play}</button>
          </figcaption>
        </figure>
        <figure>
          <StimulusPreview kind="form" seed={202} playing={playing} id="pv-form" label={t.formPreviewLabel} />
          <figcaption><Rich text={t.formCaption} /></figcaption>
        </figure>
      </div>
      <p className="caption"><Rich text={t.previewsNote} /></p>

      <fieldset id="test-type">
        <legend>{t.testTypeQuestion}</legend>
        <label className="opt">
          <input type="radio" name="test-type" value="full" id="test-type-full" checked={chosen === "full"} disabled={locked} onChange={() => pick("full")} />
          <span><Rich text={t.fullOption(MINUTES.full)} /></span>
        </label>
        <label className="opt">
          <input type="radio" name="test-type" value="quick" id="test-type-quick" checked={chosen === "quick"} disabled={locked} onChange={() => pick("quick")} />
          <span><Rich text={t.quickOption(MINUTES.quick)} /></span>
        </label>
        {locked && <p className="small-note">{t.locked[chosen]}</p>}
      </fieldset>

      <h3>{t.beforeYouStart}</h3>
      <ul className="checklist">
        {tablet
          ? <li><Rich text={t.needTabletStand} /></li>
          : <li><Rich text={t.needComputer} /></li>}
        <li><Rich text={t.needCard} /></li>
        <li><Rich text={t.needRoom(MINUTES[chosen])} /></li>
        <li><Rich text={t.needGlasses} /></li>
      </ul>
      <p className="notice"><Rich text={t.pleaseRead} /></p>
      {tooNarrow && <p className="small-note" id="setup-narrow">{tablet ? t.tooNarrowTablet : t.tooNarrow}</p>}

      <div className="actions">
        <button type="button" className="btn" id="start" disabled={tooNarrow} onClick={() => show("screen")}>{text.common.start}</button>
        <button type="button" className="btn secondary back" id="setup-back" onClick={() => show(getState().contribution?.contribute ? "questions" : "contribute")}>{text.common.back}</button>
      </div>
    </section>
  );
}
