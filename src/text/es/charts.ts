// Spanish for ../en/charts.ts, where the comments say what each entry is for.
// Only words: plain text in quotes. Change the words, leave the name before the colon, and keep
// each {value}, which the page fills in. Where a sentence changes with a number, there's one entry
// for one and another for more than one.
// AGENTS.md applies to every line: describe the numbers, never the person. No words that judge a
// result ("normal", "típico", "sano", "por debajo de la mayoría" and the like) and nothing medical.
import type { Words } from "../words";

export const charts: Words["charts"] = {
  groups: {
    loading: "Cargando la comparación…",
    loadFailed: "No se pudo cargar la comparación. Comprueba tu conexión e inténtalo de nuevo.",
    // `who` follows the name and a colon, so it starts in lower case.
    control: { name: "Grupo de control", who: "sin trastorno de la percepción visual, nunca han usado drogas psicodélicas" },
    psychedelics: { name: "Han usado psicodélicos", who: "sin trastorno de la percepción visual, han usado drogas psicodélicas" },
    lineOne: "{who}. {n} persona hasta ahora.",
    lineMany: "{who}. {n} personas hasta ahora.",
    quantiles: "mediana {median}, mitad central de {p25} a {p75}, 80% central de {p10} a {p90}",
  },

  // {series} is "Movimiento", "Forma" or "Movimiento − forma".
  bars: {
    described: "Sensibilidad. {sets}",
    noValue: "{series} sin valor",
    range: "{series} mediana {median}, mitad central de {p25} a {p75}",
    single: "{series} {value}",
    tipRange: "{set}, {series}: mediana {median}, mitad central de {p25} a {p75}",
    tip: "{set}, {series}: {value}",
    inSentence: { motion: "movimiento", form: "forma", diff: "movimiento − forma" },
  },

  staircase: {
    // {task} is "Movimiento" or "Forma".
    described: "{task}: escalera con {n} ensayos puntuados, umbral {threshold}",
    notReached: "no alcanzado",
    tip: "Ensayo {n} · {pct} · {answer}",
    tipReversal: "Ensayo {n} · {pct} · {answer} · inversión",
    correct: "correcto",
    wrong: "incorrecto",
  },

  explained: {
    more: "Más sobre cada número",
    motionAndForm: "Movimiento y forma",
    groupBars: "Las barras de los grupos",
    varies: "Por qué varía",
  },

  save: {
    label: "Guarda tus resultados",
    getting: "Obteniendo los datos…",
  },
};
