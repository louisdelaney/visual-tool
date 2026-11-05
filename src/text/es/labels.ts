// Spanish for ../en/labels.ts: short words that appear in more than one place, each written once.
//
// This file is only words. Every entry is plain text in quotes: change the words between the
// quotes, and leave the name before the colon as it is. {n}, {value} and the like are filled in by
// the page: keep them, and move them anywhere in the sentence.
// Show numbers only: no words that judge a result, like "normal" or "típico" (see AGENTS.md).
import type { Words } from "../words";

export const labels: Words["labels"] = {
  // ---- Names of pages and steps ----
  resultsByPseudonym: "Resultados por seudónimo",
  beforeYouStart: "Antes de empezar",
  viewingDistance: "Distancia de visión",

  // ---- The two tasks and the three numbers ----
  motion: "Movimiento",
  form: "Forma",
  motionMinusForm: "Movimiento − forma",
  motionThreshold: "Umbral de movimiento",
  formThreshold: "Umbral de forma",
  motionMinusFormSensitivity: "Sensibilidad de movimiento menos forma",
  sensitivity: "Sensibilidad",
  threshold: "Umbral",

  // ---- Under each number ----
  sensitivityLine: "sensibilidad {value}",
  scoredTrials: "{n} ensayos puntuados",
  thresholdRatio: "umbral de movimiento ÷ forma {value}",
  notRun: "No se hizo",
  endedEarly: "Terminó antes de tiempo",
  noThreshold: "Sin umbral",
  needsBoth: "Hacen falta los dos umbrales",

  // ---- How the run was taken, and what the person wrote ----
  takenOn: "Hecha en: {how}",
  medications: "Medicamentos",
  notes: "Notas",

  // ---- Beside the groups ----
  groupsHeading: "En comparación con otros grupos",
  thisRun: "Esta sesión",
  people: "{n} personas",
  noValue: "Esta sesión no llegó a un valor para esto.",
  thisRunValue: "Esta sesión: {value}.",
  groupValue: "{group}: {numbers}.",

  // ---- Staircases ----
  staircasesHeading: "Escaleras",
  staircaseSubtitle: "Coherencia (%) en cada ensayo puntuado, escala logarítmica",
  noStaircases: "No se conservaron las escaleras de esta sesión.",
  noTrials: "No se completó ningún ensayo.",
  trial: "Ensayo",
  keyCorrect: "Correcto",
  keyWrong: "Incorrecto",
  keyReversal: "Inversión",
  keyThreshold: "Umbral, promediado a partir de las últimas inversiones",

  numbersHeading: "Qué significan los números",

  // ---- Saving ----
  savePdf: "Guardar resumen (PDF)",
  saveSummary: "Guardar resumen (JSON)",
  saveFull: "Guardar datos completos (JSON)",
  makingPdf: "Creando el PDF…",
  saved: "Se guardó {file}.",
  couldntSave: "No se pudo guardar.",

  // ---- Development only: never in a build ----
  sampleHistory: "Datos de ejemplo para desarrollo. No es el historial real de nadie.",
  sampleGroups: "Datos de ejemplo para desarrollo. No son grupos reales.",
};
