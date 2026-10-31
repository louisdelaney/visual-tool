// Step 3: match an on-screen outline to a bank card, which gives pixels per millimetre.
import { useState, type CSSProperties } from "react";
import { CALIBRATION } from "../core";
import type { Calibration } from "../app/types";
import { dpr } from "../app/protocol";
import { round } from "../app/format";
import { calibMatchesScreen, setState } from "../app/store";
import { show } from "../app/flow";
import { useWindowSize } from "../hooks";

/** A card's width at the CSS reference 96 pixels per inch: where the slider starts. */
const CARD_DEFAULT = CALIBRATION.cardMm.w * 96 / 25.4;

interface ScreenPageProps {
  calib: Calibration | null;
}

export function ScreenPage({ calib }: ScreenPageProps) {
  const saved = calibMatchesScreen(calib) ? calib : null;
  const [cardPxRaw, setCardPx] = useState(saved ? saved.cardPx : CARD_DEFAULT);
  const { w } = useWindowSize();
  const max = Math.max(400, Math.min(1000, Math.floor(w - 40)));
  const cardPx = Math.min(max, Math.max(160, cardPxRaw));
  const pxPerMm = cardPx / CALIBRATION.cardMm.w;

  const accept = (): void => {
    setState({ calib: { cardPx: round(cardPx, 2), pxPerMm: round(cardPx / CALIBRATION.cardMm.w, 5), dpr: dpr(), measuredAt: new Date().toISOString() } });
    show("distance");
  };

  return (
    <section className="view panel" data-view="screen" aria-labelledby="screen-h">
      <h2 id="screen-h">Measure your screen</h2>
      <p>Hold a bank card, or any card the same size, flat against the screen over the outline. Move the slider until the outline is exactly as wide as the card.</p>
      <div className="card-stage">
        <div className="card" id="card" style={{ "--card-w": `${cardPx}px` } as CSSProperties}>
          <span className="chip" />
          <span className="card-label">ISO/IEC 7810 ID-1 · 85.60 × 53.98 mm</span>
        </div>
      </div>
      <div className="slider-row">
        <button type="button" className="btn secondary icon" id="card-minus" aria-label="Make the outline smaller" onClick={() => setCardPx(cardPx - 0.5)}>−</button>
        <input type="range" id="card-size" min={160} max={max} step={0.5} aria-label="Card outline width" value={cardPx} onChange={e => setCardPx(parseFloat(e.target.value))} />
        <button type="button" className="btn secondary icon" id="card-plus" aria-label="Make the outline larger" onClick={() => setCardPx(cardPx + 0.5)}>+</button>
      </div>
      <p className="readout" id="card-readout">{`${cardPx.toFixed(1)} px wide · ${pxPerMm.toFixed(3)} px per mm · ${(pxPerMm * 25.4).toFixed(0)} px per inch`}</p>
      {saved && Math.abs(saved.cardPx - cardPx) < 0.01 && (
        <p className="hint" id="saved-calib">The outline is set to the size saved on this browser. Check it still matches your card.</p>
      )}
      <p className="hint">Don't change the browser zoom after this step, and keep the window on this screen.</p>
      <div className="actions">
        <button type="button" className="btn" id="screen-next" onClick={accept}>The outline matches my card</button>
        <button type="button" className="btn secondary back" id="screen-back" onClick={() => show("setup")}>Back</button>
      </div>
    </section>
  );
}
