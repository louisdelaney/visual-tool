// Spanish for ../en/status.ts, where the comments say what each entry is for.
import type { Words } from "../words";

export const status: Words["status"] = {
  leaveResults: "¿Dejar tus resultados y empezar de nuevo? Guárdalos antes si quieres una copia.",
  changeLanguage: "¿Cambiar de idioma? La página se carga de nuevo, así que la prueba empieza desde el principio y se pierden los resultados que no hayas guardado.",
  redoTask: {
    motion: "¿Volver y repetir la tarea de movimiento? Tus resultados de movimiento hasta ahora se reemplazarán.",
    form: "¿Volver y repetir la tarea de forma? Tus resultados de forma hasta ahora se reemplazarán.",
  },
  screenChanged: "El zoom del navegador o la pantalla han cambiado desde que mediste la tarjeta. Mídela de nuevo.",
  gettingReady: "Preparando…",
  taskFailed: "Algo salió mal al ejecutar la tarea. Intenta empezarla de nuevo.",
};
