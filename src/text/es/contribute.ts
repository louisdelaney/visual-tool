// Spanish for ../en/contribute.ts, where the comments say what each entry is for.
// Only words: plain text in quotes. Change the words, leave the name before the colon, and keep
// each {value}, which the page fills in.
import type { Words } from "../words";

export const contribute: Words["contribute"] = {
  measuresHeading: "Qué mide la prueba",

  phone: {
    heading: "La prueba no puede hacerse en este dispositivo",
  },

  contributeHeading: "Aporta tus resultados",
  contributeQuestion: "¿Aportar datos anónimos?",
  contributeYes: "Sí, añadir mis resultados y respuestas al conjunto de datos público",
  contributeNo: "No, no enviar nada",

  pseudonymLabel: "Seudónimo (opcional)",
  copy: "Copiar",
  copyPseudonym: "Copiar el seudónimo",
  copied: "Copiado",
  generate: "Generar uno",
  generating: "Generando…",
  copiedStatus: "Se copió tu seudónimo.",
  copyBlocked: "Aquí no se permite copiar. Está seleccionado: pulsa Ctrl+C, o ⌘C en un Mac.",

  questionsFor: "Preguntas para",
  fillIn: "Rellenar con las últimas respuestas",
  filling: "Rellenando…",
  sentUnderPseudonym: "Tus respuestas y resultados se envían con este seudónimo.",
  fillNone: "No se encontraron respuestas anteriores de {pseudonym}.",
  fillDone: "Rellenado con tu prueba del {date}. Revisa cada respuesta y cambia lo que sea distinto ahora.",
  fillFailed: "No se pudieron cargar tus respuestas anteriores. Puedes rellenarlas tú.",
  aboutYou: "Sobre ti",

  disorderQuestion: "¿Tienes, o sospechas que tienes, un trastorno de la percepción visual?",
  conditionQuestion: "¿Cuál?",
  conditions: { vss: "Síndrome de nieve visual (VSS)", hppd: "Trastorno perceptivo persistente por alucinógenos (HPPD)", other: "Otro" },
  otherConditionLabel: "Otro trastorno (opcional, público)",
  otherConditionPlaceholder: "¿Qué trastorno? (opcional)",
  diagnosedQuestion: "¿Te lo ha diagnosticado un médico?",

  psychedelicsQuestion: "¿Has usado alguna vez drogas psicodélicas? (opcional)",
  clearAnswer: "Borrar la respuesta",
  usesQuestion: "Estima cuántas veces",
  sinceQuestion: "¿Cuánto hace que las usaste por última vez? (opcional)",
  years: "años",
  months: "meses",
  psychedelicsUsedQuestion: "¿Cuáles has usado? (opcional)",

  medicationQuestion: "¿Tomas algún medicamento? (opcional)",
  medicationsQuestion: "¿Cuáles? (opcional)",

  ageQuestion: "¿Qué edad tienes? (opcional)",
  ageRanges: { "under-18": "Menos de 18", "18-24": "De 18 a 24", "25-34": "De 25 a 34", "35-44": "De 35 a 44", "45-54": "De 45 a 54", "55-64": "De 55 a 64", "65-plus": "65 o más" },

  extrasHeading: "Extras opcionales",
  notesLabel: "Notas (opcional)",
  foundViaQuestion: "¿Dónde nos encontraste? (opcional)",
  foundVia: { reddit: "Reddit", forum: "Foro", other: "Otro" },
  foundViaOtherLabel: "¿Dónde nos encontraste? (público)",
  foundViaOtherPlaceholder: "¿Dónde?",

  errors: {
    contribute: "Elige si quieres contribuir.",
    yesOrNo: "Elige Sí o No.",
    condition: "Elige qué trastorno.",
    uses: "Escribe un número entero, 1 o más.",
    since: "Usa números enteros, con los meses de 0 a 11, o deja las dos casillas en blanco.",
    answerHighlighted: "Responde a la pregunta resaltada arriba.",
  },

  chips: {
    added: "Añadidos: {n}",
    remove: "Quitar {item}",
    addPsychedelic: "Añadir psicodélico",
    addMedication: "Añadir medicamento",
  },
};
