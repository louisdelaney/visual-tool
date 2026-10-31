// Step 4: the viewing distance, from the blind-spot check or typed in, and whether the tasks fit
// in this window at that distance.
import { useState } from "react";
import { Core, PROTOCOL } from "../core";
import type { Calibration, Distance } from "../app/types";
import { TASK_ORDER } from "../app/protocol";
import { setState } from "../app/store";
import { measureDistance, show } from "../app/flow";
import { createSession } from "../app/session";
import { goFullscreen } from "../stage/fullscreen";
import { useFullscreen, useWindowSize } from "../hooks";

function DistanceResult({ distance }: { distance: Distance | null }) {
  if (!distance) return <>Not measured yet.</>;
  if (distance.method !== "blind-spot") return <>Viewing distance: <strong>{distance.cm.toFixed(0)} cm</strong>, entered by hand.</>;
  const lo = Math.min(...distance.readings), hi = Math.max(...distance.readings);
  return (
    <>
      Viewing distance: <strong>{distance.cm.toFixed(0)} cm</strong>, from {distance.readings.length} blind-spot readings between {lo.toFixed(0)} and {hi.toFixed(0)} cm.
      {(hi - lo) / distance.cm > 0.2 ? " The readings vary a lot, so try the check again if you can." : ""}
    </>
  );
}

/** How much of the view the window covers at this distance, and whether the tasks fit. */
function fitText(distance: Distance, calib: Calibration, W: number, H: number): string {
  const ppd = Core.pxPerDeg(calib.pxPerMm * 10, distance.cm);
  const field = PROTOCOL.field;
  const scale = Core.fitScale(W, H, ppd, field.w, field.h);
  const pxPerCm = calib.pxPerMm * 10;
  const span = `At ${distance.cm.toFixed(0)} cm this window covers about ${Core.angularExtentDeg(W / pxPerCm, distance.cm).toFixed(0)}° × ${Core.angularExtentDeg(H / pxPerCm, distance.cm).toFixed(0)}° of your view, and the tasks need ${field.w}° × ${field.h}°.`;
  return scale >= 0.999
    ? `${span} They fit at full size.`
    : `${span} They'll be shown at ${Math.round(scale * 100)}% of full size. For full size, go full screen, or sit at about ${Math.floor(distance.cm * scale)} cm and measure again.`;
}

interface DistancePageProps {
  calib: Calibration | null;
  distance: Distance | null;
}

export function DistancePage({ calib, distance }: DistancePageProps) {
  const [manual, setManual] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const { w, h } = useWindowSize();
  const fullscreen = useFullscreen();

  const partial = !fullscreen && w < 0.85 * screen.width;
  const windowNote = !partial ? "" : document.fullscreenEnabled
    ? "This window is narrower than your screen. The blind-spot check and the tasks switch to full screen when they start, because both assume you're sitting centred on what the page draws."
    : "This window is narrower than your screen, and full screen isn't available here. Maximise the window and sit centred on it: the blind-spot check and the tasks both assume you're centred on what the page draws.";

  const useManual = (): void => {
    const v = parseFloat(manual);
    if (!(v >= 25 && v <= 150)) { setManualMsg("Enter a distance between 25 and 150 cm."); return; }
    setManualMsg("");
    setState({ distance: { cm: v, method: "manual", readings: [] } });
  };

  const next = (): void => {
    if (!distance || !calib) return;
    createSession();
    show(TASK_ORDER[0]);
  };

  const fullScreen = async (): Promise<void> => {
    if (!(await goFullscreen())) setState({ flash: "Full screen isn't available here. Maximise the browser window instead." });
  };

  return (
    <section className="view panel" data-view="distance" aria-labelledby="distance-h">
      <h2 id="distance-h">Measure your viewing distance</h2>
      <p>The tasks are specified in degrees of visual angle, so the page needs to know how far your eyes are from the screen. It works this out from your blind spot, which sits about 13.5° from wherever you look. Sit centred in front of the screen, as you will for the tasks: the maths assumes it.</p>
      <p className="notice" id="window-note" hidden={!partial}>{windowNote}</p>
      <div className="actions"><button type="button" className="btn" id="bs-start" onClick={() => void measureDistance()}>Start blind-spot check</button></div>
      <p className="result" id="distance-result"><DistanceResult distance={distance} /></p>
      <div className="manual">
        <label htmlFor="manual-cm">Or enter a distance you've measured, eye to screen</label>
        <div className="inline">
          <input type="number" id="manual-cm" min={25} max={150} step={1} inputMode="numeric" value={manual} onChange={e => setManual(e.target.value)} />
          <span>cm</span>
          <button type="button" className="btn secondary" id="manual-use" onClick={useManual}>Use this distance</button>
        </div>
        <p className="field-msg" id="manual-msg" role="status">{manualMsg}</p>
      </div>
      <p className="fit" id="fit" hidden={!(distance && calib)}>{distance && calib ? fitText(distance, calib, w, h) : ""}</p>
      <div className="actions">
        <button type="button" className="btn" id="distance-next" disabled={!(distance && calib)} onClick={next}>Continue to the tasks</button>
        <button type="button" className="btn secondary" id="fs-btn" onClick={() => void fullScreen()}>Go full screen</button>
        <button type="button" className="btn secondary back" id="distance-back" onClick={() => show("screen")}>Back</button>
      </div>
    </section>
  );
}
