// Spanish for ../en/pdf.ts, where the comments say what each entry is for: the words only the PDF
// has. Most of what it shows is in labels.ts.
// Only words: plain text in quotes, with no <strong> or other formatting. Change the words, leave
// the name before the colon, and keep each {value}. {name} is the test's name (../languages.ts).
// Show numbers only: no words that judge a result, like "normal" or "típico" (see AGENTS.md).
import type { Words } from "../words";

export const pdf: Words["pdf"] = {
  docTitleOne: "{name}: resumen de resultados",
  docTitleMany: "{name}: resúmenes de resultados",
  footer: "{name} · Solo por diversión, no es un consejo médico.",
  pageOf: "Página {page} de {pages}",

  resultsForOne: "Resultados de {pseudonym}: {sessions} sesión",
  resultsForMany: "Resultados de {pseudonym}: {sessions} sesiones, de la más reciente a la más antigua",
  resultsSummary: "Resumen de resultados",

  labelBefore: "{label}:",
  staircaseSubtitle: "{subtitle}.",
  // {testType} is "Prueba completa" or "Prueba rápida".
  testLine: "{testType} · versión {version} de la prueba",
};
