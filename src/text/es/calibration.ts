// Spanish for ../en/calibration.ts, where the comments say what each entry is for.
// Only words: plain text in quotes. Change the words, leave the name before the colon, and keep
// each {value}, which the page fills in. <strong> marks bold and <kbd> a key.
import type { Words } from "../words";

export const calibration: Words["calibration"] = {
  screen: {
    heading: "Mide tu pantalla",
    cardLabel: "ISO/IEC 7810 ID-1 · 85,60 × 53,98 mm",
    smaller: "Hacer el contorno más pequeño",
    sliderLabel: "Ancho del contorno de la tarjeta",
    larger: "Hacer el contorno más grande",
    readout: "{px} px de ancho · {perMm} px por mm · {perInch} px por pulgada",
    matches: "El contorno coincide con mi tarjeta",
  },

  distance: {
    heading: "Mide tu distancia de visión",
    startCheck: "Empezar la comprobación del punto ciego",

    notMeasured: "Aún no se ha medido.",
    byHand: "Distancia de visión: <strong>{cm} cm</strong>, escrita a mano.",
    fromBlindSpot: "Distancia de visión: <strong>{cm} cm</strong>, a partir de {readings} mediciones del punto ciego de entre {lo} y {hi} cm.",
    readingsVary: "Las mediciones varían mucho, así que repite la comprobación si puedes.",

    manualLabel: "O escribe una distancia que hayas medido, de los ojos a la pantalla",
    cm: "cm",
    useManual: "Usar esta distancia",
    manualOutOfRange: "Escribe una distancia de entre 25 y 150 cm.",

    fitSpan: "A {cm} cm, esta ventana ocupa unos {wDeg}° × {hDeg}° de tu campo de visión, y las tareas necesitan {needW}° × {needH}°.",
    fitsFull: "Caben a tamaño completo.",
    fitsScaled: "Se mostrarán al {pct}% del tamaño completo. Para verlas a tamaño completo, pasa a pantalla completa, o siéntate a unos {cm} cm y mide de nuevo.",

    next: "Continuar a las tareas",
  },

  blindSpot: {
    title: "Comprobación del punto ciego",
    // "Esc para cancelar".
    cancel: "Cancelar",
    cancelVerb: "cancelar",
    hud: "Medición {rep} de {of} · Espacio cuando el punto desaparezca · Esc para parar",
    // "Esc para parar".
    stop: "Parar",
    stopVerb: "parar",
    noFit: "Esa medición no encaja con la geometría.",
    unlikely: "Esa medición da {cm} cm, lo cual es poco probable.",
    pressOnce: "Pulsa <kbd>Espacio</kbd> solo cuando el punto haya desaparecido por completo.",
  },
};
