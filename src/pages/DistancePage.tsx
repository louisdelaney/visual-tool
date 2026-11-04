// Step 4: the viewing distance, from the blind-spot check or typed in, and whether the tasks fit
// in this window at that distance.
import { useState } from "react";
import { Core, PROTOCOL } from "../core";
import type { Calibration, Distance } from "../app/types";
import { TASK_ORDER } from "../app/protocol";
import { setState } from "../app/store";
import { measureDistance, show } from "../app/flow";
import { createSession } from "../app/session";
import { thisDevice } from "../app/device";
import { goFullscreen } from "../stage/fullscreen";
import { useFullscreen, useWindowSize } from "../hooks";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.calibration.distance;

function DistanceResult({ distance }: { distance: Distance | null }) {
  if (!distance) return <>{t.notMeasured}</>;
  if (distance.method !== "blind-spot") return <Rich text={t.byHand(distance.cm.toFixed(0))} />;
  const lo = Math.min(...distance.readings), hi = Math.max(...distance.readings);
  return (
    <>
      <Rich text={t.fromBlindSpot(distance.cm.toFixed(0), distance.readings.length, lo.toFixed(0), hi.toFixed(0))} />
      {(hi - lo) / distance.cm > 0.2 ? ` ${t.readingsVary}` : ""}
    </>
  );
}

/** How much of the view the window covers at this distance, and whether the tasks fit. */
function fitText(distance: Distance, calib: Calibration, W: number, H: number): string {
  const ppd = Core.pxPerDeg(calib.pxPerMm * 10, distance.cm);
  const field = PROTOCOL.field;
  const scale = Core.fitScale(W, H, ppd, field.w, field.h);
  const pxPerCm = calib.pxPerMm * 10;
  const span = t.fitSpan(distance.cm.toFixed(0), Core.angularExtentDeg(W / pxPerCm, distance.cm).toFixed(0), Core.angularExtentDeg(H / pxPerCm, distance.cm).toFixed(0), field.w, field.h);
  return scale >= 0.999
    ? `${span} ${t.fitsFull}`
    : `${span} ${t.fitsScaled(Math.round(scale * 100), Math.floor(distance.cm * scale))}`;
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
    ? t.windowNarrowFullScreen
    : t.windowNarrowNoFullScreen;

  const useManual = (): void => {
    const v = parseFloat(manual);
    if (!(v >= 25 && v <= 150)) { setManualMsg(t.manualOutOfRange); return; }
    setManualMsg("");
    setState({ distance: { cm: v, method: "manual", readings: [] } });
  };

  const next = (): void => {
    if (!distance || !calib) return;
    createSession();
    show(TASK_ORDER[0]);
  };

  const fullScreen = async (): Promise<void> => {
    if (!(await goFullscreen())) setState({ flash: text.common.fullScreenUnavailable });
  };

  return (
    <section className="view panel" data-view="distance" aria-labelledby="distance-h">
      <h2 id="distance-h">{t.heading}</h2>
      <p><Rich text={t.intro} /></p>
      <p className="notice" id="window-note" hidden={!partial}><Rich text={windowNote} /></p>
      <div className="actions"><button type="button" className="btn" id="bs-start" onClick={() => void measureDistance()}>{t.startCheck}</button></div>
      {thisDevice() === "tablet" && <p className="small-note" id="bs-tablet"><Rich text={t.tabletNote} /></p>}
      <p className="result" id="distance-result"><DistanceResult distance={distance} /></p>
      <div className="manual">
        <label htmlFor="manual-cm">{t.manualLabel}</label>
        <div className="inline">
          <input type="number" id="manual-cm" min={25} max={150} step={1} inputMode="numeric" value={manual} onChange={e => setManual(e.target.value)} />
          <span>{t.cm}</span>
          <button type="button" className="btn secondary" id="manual-use" onClick={useManual}>{t.useManual}</button>
        </div>
        <p className="field-msg" id="manual-msg" role="status">{manualMsg}</p>
      </div>
      <p className="fit" id="fit" hidden={!(distance && calib)}>{distance && calib ? fitText(distance, calib, w, h) : ""}</p>
      <div className="actions">
        <button type="button" className="btn" id="distance-next" disabled={!(distance && calib)} onClick={next}>{t.next}</button>
        <button type="button" className="btn secondary" id="fs-btn" onClick={() => void fullScreen()}>{text.common.goFullScreen}</button>
        <button type="button" className="btn secondary back" id="distance-back" onClick={() => show("screen")}>{text.common.back}</button>
      </div>
    </section>
  );
}
