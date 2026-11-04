// Step 3: match an on-screen outline to a bank card, which gives pixels per millimetre.
import { useState, type CSSProperties } from "react";
import { CALIBRATION } from "../core";
import type { Calibration } from "../app/types";
import { dpr } from "../app/protocol";
import { round } from "../app/format";
import { calibMatchesScreen, setState } from "../app/store";
import { show } from "../app/flow";
import { useWindowSize } from "../hooks";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.calibration.screen;

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
    setState({ calib: { cardPx: round(cardPx, 2), pxPerMm: round(cardPx / CALIBRATION.cardMm.w, 5), dpr: dpr() } });
    show("distance");
  };

  return (
    <section className="view panel" data-view="screen" aria-labelledby="screen-h">
      <h2 id="screen-h">{t.heading}</h2>
      <p><Rich text={t.instructions} /></p>
      <div className="card-stage">
        <div className="card" id="card" style={{ "--card-w": `${cardPx}px` } as CSSProperties}>
          <span className="chip" />
          <span className="card-label">{t.cardLabel}</span>
        </div>
      </div>
      <div className="slider-row">
        <button type="button" className="btn secondary icon" id="card-minus" aria-label={t.smaller} onClick={() => setCardPx(cardPx - 0.5)}>−</button>
        <input type="range" id="card-size" min={160} max={max} step={0.5} aria-label={t.sliderLabel} value={cardPx} onChange={e => setCardPx(parseFloat(e.target.value))} />
        <button type="button" className="btn secondary icon" id="card-plus" aria-label={t.larger} onClick={() => setCardPx(cardPx + 0.5)}>+</button>
      </div>
      <p className="readout" id="card-readout">{t.readout(cardPx.toFixed(1), pxPerMm.toFixed(3), (pxPerMm * 25.4).toFixed(0))}</p>
      {saved && Math.abs(saved.cardPx - cardPx) < 0.01 && (
        <p className="hint" id="saved-calib"><Rich text={t.savedSize} /></p>
      )}
      <p className="hint"><Rich text={t.keepZoom} /></p>
      <div className="actions">
        <button type="button" className="btn" id="screen-next" onClick={accept}>{t.matches}</button>
        <button type="button" className="btn secondary back" id="screen-back" onClick={() => show("setup")}>{text.common.back}</button>
      </div>
    </section>
  );
}
