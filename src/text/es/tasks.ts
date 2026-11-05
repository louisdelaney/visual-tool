// Spanish for ../en/tasks.ts, where the comments say what each entry is for. Rewording these can
// change how people answer: keep the meaning exactly as in English.
// Only words: plain text in quotes. Change the words, leave the name before the colon, and keep
// each {value}, which the page fills in. <kbd> marks a key.
import type { Words } from "../words";

export const tasks: Words["tasks"] = {
  intro: {
    // {task} is "Tarea de movimiento" or "Tarea de forma".
    eyebrow: "Tarea {n} de 2",
    eyebrowDone: "Tarea {n} de 2 · {task} terminada",
    previewLabel: { motion: "Ejemplo de la tarea de movimiento", form: "Ejemplo de la tarea de forma" },
    keys: {
      up: "los puntos se desplazan hacia arriba",
      down: "los puntos se desplazan hacia abajo",
      first: "la estrella en el primer destello",
      second: "la estrella en el segundo destello",
    },
    keyOr: "o",
    escPause: "<kbd>Esc</kbd> pausa",
    startPractice: "Empezar la práctica ({trials} ensayos)",
  },

  practiceTitle: "{task}: práctica",
  startPractice: "Empezar la práctica",
  // "Esc para volver".
  backVerb: "volver",

  correct: "Correcto",
  notQuite: "No del todo. {answer}",
  answer: {
    up: "Los puntos se desplazaban hacia arriba.",
    down: "Los puntos se desplazaban hacia abajo.",
    first: "La estrella estaba en el primer destello.",
    second: "La estrella estaba en el segundo destello.",
  },

  practiceDone: "Práctica terminada",
  startTest: "Empezar la prueba",
  practiseAgain: "Practicar otra vez",
  // "Esc para practicar otra vez".
  practiseAgainVerb: "practicar otra vez",

  // The wide gaps are two spaces each side.
  hud: {
    motion: "Arriba: ↑  ·  Abajo: ↓  ·  Pausa: Esc",
    form: "Primer destello: 1 o ←  ·  Segundo destello: 2 o →  ·  Pausa: Esc",
  },

  messageHint: "<kbd>Espacio</kbd> para continuar",
  messageHintEsc: "<kbd>Espacio</kbd> para continuar · <kbd>Esc</kbd> para {action}",

  pause: {
    heading: "En pausa",
    resume: "Seguir",
    end: "Terminar y ver los resultados",
  },
};
