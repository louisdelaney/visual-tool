// Spanish for ../en/history.ts, where the comments say what each entry is for.
// Only words: plain text in quotes. Change the words, leave the name before the colon, and keep
// each {value}, which the page fills in. Where a sentence changes with a number, there's one entry
// for one and another for more than one.
// Show numbers only: no words that judge a result, like "normal" or "típico" (see AGENTS.md).
import type { Words } from "../words";

export const history: Words["history"] = {
  pseudonymLabel: "Seudónimo",
  showResults: "Ver resultados",
  lookingUp: "Buscando {pseudonym}…",
  loadFailed: "No se pudieron cargar los resultados de {pseudonym}. Comprueba tu conexión e inténtalo de nuevo.",
  noResults: "No hay resultados de «{pseudonym}». Los seudónimos no distinguen mayúsculas ni espacios de más, pero por lo demás deben coincidir exactamente.",

  saveAllLabel: "Guardar todas las sesiones",
  saveAllButton: "Guardar todo",
  saveAllPdf: "Guardar resúmenes (PDF)",
  saveAllPdfDescription: "Todas las sesiones de {pseudonym}, con sus gráficos, en un solo archivo para leer o imprimir.",
  saveAllSummaries: "Guardar resúmenes (JSON)",
  saveAllSummariesDescription: "Todas las sesiones de {pseudonym}: respuestas, resultados y puntos de las escaleras, en un solo archivo.",
  saveAllRawDescription: "Todas las sesiones de {pseudonym} completas, tal como están guardadas en la base de datos, en un solo archivo.",
  sessionsHeadingOne: "{pseudonym}: {count} sesión",
  sessionsHeadingMany: "{pseudonym}: {count} sesiones, de la más reciente a la más antigua",
  fetchFailed: "No se pudieron obtener los datos. Comprueba tu conexión e inténtalo de nuevo.",
  sessionMissing: "No se encontraron los datos de esa sesión. Puede que se haya eliminado.",

  selectTitle: "Seleccionar para un PDF de las sesiones elegidas",
  selectLabel: "Seleccionar esta sesión para un PDF de las sesiones elegidas",
  saveOneLabel: "Guardar esta sesión",
  savePdfDescription: "Sus resultados, sus gráficos y los grupos tal como están ahora, para leer o imprimir.",
  saveSummaryDescription: "Sus respuestas, sus resultados y los puntos de los gráficos de escalera.",
  saveFullDescription: "Todo lo registrado, exactamente como está guardado en la base de datos.",

  selectionLabel: "Sesiones seleccionadas",
  selectedOne: "<strong>{count}</strong> sesión seleccionada",
  selectedMany: "<strong>{count}</strong> sesiones seleccionadas",
  clear: "Borrar selección",
  saveAsPdf: "Guardar como PDF",

  // "Computadora · a 55 cm · pantalla completa".
  run: {
    device: { computer: "Computadora", tablet: "Tableta" },
    distance: "a {cm} cm",
    fullScreen: "pantalla completa",
    notFullScreen: "sin pantalla completa",
  },
};
