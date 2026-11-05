// Spanish for ../en/method.ts: the tables on Method and references. Same rows, in the same order.
//
// These describe the test as it is (src/core/protocol.ts): change a number here only when the
// English changes. Paper names in `source` ("Pavan 2013") match the list of papers in
// src/components/methodData.ts, so they stay as published.
import type { MethodVersion, ProtocolGroup, ProtocolRow } from "../method";
import type { Words } from "../words";

// Rows that are the same in every version of the test.
const MOTION_ROWS: ProtocolRow[] = [
  { parameter: "Movimiento: presentación", value: "250 puntos blancos de 0,03° (dibujados con al menos 1 píxel), en un cuadrado de 8° × 8° sobre negro; punto de fijación rojo de 0,4°, que se muestra solo durante 1 s antes", source: "Pavan 2013" },
  { parameter: "Movimiento: señal y ruido", value: "Una proporción de los puntos se desplaza hacia arriba o hacia abajo a 20,1°/s; el resto se redibuja al azar en cada fotograma; cada punto vive 83,3 ms", source: "Pavan 2013" },
  { parameter: "Movimiento: tiempos y respuesta", value: "Después de 1 s de fijación, los puntos se muestran durante 200 ms, lo mismo para todo el mundo; el punto rojo sigue visible. Se responde arriba o abajo desde el momento en que aparecen los puntos; una respuesta temprana no acorta los 200 ms", source: "Pavan 2013 (allí el punto de fijación se quitaba cuando aparecían los puntos)" },
];
const FORM_PATTERN: ProtocolRow = { parameter: "Forma: patrón", value: "2146 pares de puntos en un círculo de 10,7°; puntos de 0,04°, separados 0,25°; blanco sobre negro; punto de fijación gris de 0,3°", source: "Roccato 2024" };
const FORM_FLICKER: ProtocolRow = { parameter: "Forma: parpadeo", value: "12 patrones nuevos en cada destello de 200 ms, o un solo patrón fijo", source: "Roccato 2024" };
const COHERENCE: ProtocolRow = { parameter: "Coherencia", value: "Proporción de puntos o de pares de puntos que llevan la señal; sin corrección por tiempo de vida", source: "Pavan 2013; Roccato 2024" };
const STAIRCASE: ProtocolRow = { parameter: "Escalera", value: "Empieza en el 100%; ×0,84 después de cada respuesta correcta hasta el primer error, luego ×0,84 después de tres respuestas correctas seguidas y ÷0,84 después de un error, lo que apunta a un 79% de aciertos", source: "La regla de 3 abajo/1 arriba y el objetivo del 79%, como en Roccato 2024; los pasos fijos de ×0,84 se eligieron aquí" };
const EASY_TRIALS: ProtocolRow = { parameter: "Ensayos fáciles y práctica", value: "Un ensayo al 100% después de cada ocho, que no se puntúa; 4 ensayos de práctica con retroalimentación, que se pueden repetir", source: "Elegido aquí" };
const SENSITIVITY: ProtocolRow = { parameter: "Sensibilidad", value: "1 ÷ el umbral en porcentaje", source: "Elegido aquí" };

const V2_FORM_ROWS: ProtocolRow[] = [
  FORM_PATTERN,
  { parameter: "Forma: figura", value: "Radial: los pares de señal apuntan a lo largo del radio, hacia fuera desde el centro, como una estrella; los demás pares apuntan en cualquier dirección", source: "Roccato 2024 (su condición radial); también probado en Seu & Ferrera 2001" },
  FORM_FLICKER,
  { parameter: "Forma: ensayo", value: "1 s de fijación, destello, pausa de 0,5 s, destello; un destello contiene la estrella y el otro solo pares al azar; se responde en qué destello estaba la estrella", source: "Roccato 2024" },
];
const V2_BASIS: ProtocolRow = { parameter: "Base", value: "Dos tareas publicadas de investigación sobre la visión: puntos que se desplazan hacia arriba o hacia abajo, y un patrón de estrella parpadeante que se muestra en dos destellos", source: "Pavan 2013; Roccato 2024; Seu & Ferrera 2001" };

/** Newest first. */
const versions: MethodVersion[] = [
  {
    version: 2,
    about: "La versión actual, desde el 2 de noviembre de 2026. Sus resultados solo se muestran junto a otros resultados de la versión 2.",
    changes: [
      "La tarea de forma muestra un patrón radial, una estrella, en lugar de una espiral de 45°, así que todos los parámetros de forma vienen de una condición publicada.",
      "Cada tarea dura más: se detiene a las 16 inversiones en lugar de a las 10 y usa las últimas 12 en lugar de las últimas 8.",
      "El umbral se promedia en una escala logarítmica (una media geométrica), porque los pasos de la escalera se multiplican.",
    ],
    quick: {
      about: "La versión 2 también tiene una prueba rápida. Es la misma prueba con menos ensayos: todo lo que ves y haces es igual, incluidos los estímulos, los tiempos y los pasos de la escalera. Sus resultados varían más de una vez a otra, así que se marcan como rápidos y solo se muestran junto a otros resultados rápidos de la versión 2. Cada sesión de los datos públicos registra qué prueba fue, en su campo test_type («full» para la completa o «quick» para la rápida), para que quien use los datos pueda mantenerlas separadas. Las sesiones anteriores a la prueba rápida no tienen test_type y son todas de la prueba completa.",
      differences: [
        "Se detiene a las 8 inversiones en lugar de a las 16, y calcula el umbral a partir de las últimas 6 en lugar de las últimas 12.",
        "Se detiene después de 80 ensayos puntuados por tarea como máximo, en lugar de 150.",
        "El ensayo fácil de control llega después de cada 16 ensayos en lugar de cada 8.",
        "Son unos 48 ensayos por tarea en lugar de 90, así que dura más o menos la mitad.",
      ],
    },
    tasks: {
      title: "Las tareas",
      rows: [
        V2_BASIS,
        ...MOTION_ROWS,
        ...V2_FORM_ROWS,
        COHERENCE,
        STAIRCASE,
        { parameter: "Parada y umbral", value: "Se detiene a las 16 inversiones; el umbral es la media geométrica de las últimas 12, un promedio calculado en una escala logarítmica porque los pasos se multiplican", source: "16 inversiones y las últimas 12, como en Pavan 2013; por lo general dentro de los 70–120 ensayos que recomiendan Alcalá-Quintana & García-Pérez 2007, promediado en una escala logarítmica como hacen ellos" },
        EASY_TRIALS,
        SENSITIVITY,
      ],
    },
  },
  {
    version: 1,
    about: "La primera versión, hasta el 2 de noviembre de 2026. Sus resultados siguen en los datos públicos, separados de los de la versión 2: las dos nunca se juntan ni se comparan.",
    changes: [],
    tasks: {
      title: "Las tareas",
      rows: [
        { parameter: "Base", value: "Dos tareas publicadas de investigación sobre la visión: puntos que se desplazan hacia arriba o hacia abajo, y una espiral parpadeante que se muestra en dos destellos", source: "Pavan 2013; Roccato 2024; Seu & Ferrera 2001" },
        ...MOTION_ROWS,
        FORM_PATTERN,
        { parameter: "Forma: figura", value: "Espiral: los pares de señal están a 45° del radio, girando hacia un lado o hacia el otro al azar; los demás pares apuntan en cualquier dirección", source: "Los 45° se eligieron aquí (Roccato 2024 no los indica); patrones de Glass en espiral de Seu & Ferrera 2001" },
        FORM_FLICKER,
        { parameter: "Forma: ensayo", value: "1 s de fijación, destello, pausa de 0,5 s, destello; un destello contiene la espiral y el otro solo pares al azar; se responde en qué destello estaba la espiral", source: "Roccato 2024" },
        COHERENCE,
        STAIRCASE,
        { parameter: "Parada y umbral", value: "Se detiene a las 10 inversiones; el umbral es la media simple de las últimas 8", source: "Elegido aquí" },
        EASY_TRIALS,
        SENSITIVITY,
      ],
    },
  },
];

/** The same in every version. */
const calibration: ProtocolGroup = {
  title: "Tamaño de pantalla y distancia de visión",
  rows: [
    { parameter: "Tamaño de pantalla", value: "Se ajusta a una tarjeta ID-1, de 85,60 mm de ancho", source: "Li 2020" },
    { parameter: "Distancia de visión", value: "Punto ciego a 13,5° de la fijación, donde el punto empieza a desaparecer; media de 5 mediciones. El cuadrado de fijación está 3 cm a la derecha del centro en ventanas de al menos 43 cm de ancho y en el borde derecho en las más estrechas, así que el punto siempre pasa por el centro del punto ciego hasta unos 80 cm. Cada medición se resuelve para una visión fuera del eje, suponiendo que el ojo izquierdo está 3,15 cm a la izquierda del centro. El punto es rojo y más oscuro que su fondo gris claro, así que nada brillante cae en el punto ciego", source: "Li 2020 para el método y el ángulo de entrada de 13,5°; la disposición, el cálculo fuera del eje y los colores se eligieron aquí" },
    { parameter: "Ventana", value: "La comprobación y las tareas pasan a pantalla completa al empezar, porque las dos dan por hecho que te sientas en el centro de lo que dibuja la página", source: "Elegido aquí" },
  ],
};

export const method: Words["method"] = { versions, calibration };
