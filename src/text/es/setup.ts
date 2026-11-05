// Spanish for ../en/setup.ts, where the comments say what each entry is for.
// Only words: plain text in quotes. Change the words, and leave the name before the colon.
import type { Words } from "../words";

export const setup: Words["setup"] = {
  heading: "Lo que verás",
  motionPreviewLabel: "Ejemplo animado de la tarea de movimiento",
  formPreviewLabel: "Ejemplo de la tarea de forma",
  pause: "Pausar",
  play: "Reproducir",

  testTypeQuestion: "Prueba completa o rápida",
  locked: {
    full: "Ya has empezado la prueba completa, así que esto se queda como está hasta que empieces de nuevo.",
    quick: "Ya has empezado la prueba rápida, así que esto se queda como está hasta que empieces de nuevo.",
  },

  tooNarrowTablet: "La pantalla es demasiado estrecha en esta posición. Gira la tableta para ponerla en horizontal y poder empezar.",
  tooNarrow: "Esta ventana es demasiado estrecha para las tareas. Hazla más ancha o maximízala para empezar.",
};
