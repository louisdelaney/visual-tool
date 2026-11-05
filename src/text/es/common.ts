// Spanish for ../en/common.ts, where the comments say what each entry is for.
//
// The Spanish on this site: informal "tú", and wording chosen to read naturally in both Spain and
// Latin America ("computadora", "tableta", "archivo"). Numbers take a decimal comma (12,5) and a
// percent sign straight after the number (12,5%).
import type { Words } from "../words";

export const common: Words["common"] = {
  locale: "es",
  decimal: ",",
  percent: "{value}%",
  separator: "·",
  back: "Atrás",
  continue: "Continuar",
  start: "Empezar",
  yes: "Sí",
  no: "No",
  tryAgain: "Intentar de nuevo",
  choose: "Elige…",
  goFullScreen: "Pasar a pantalla completa",
  fullScreenUnavailable: "Aquí no se puede usar la pantalla completa. Maximiza la ventana del navegador.",
  none: "–",
  taskLabel: { motion: "Tarea de movimiento", form: "Tarea de forma" },
  testTypeLabel: { full: "Prueba completa", quick: "Prueba rápida" },
};
