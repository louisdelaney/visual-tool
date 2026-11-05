// Spanish for ../en/infoPages.ts: the short words on the long pages. The pages themselves are
// privacy.md, references.md and data.md.
// Only words: plain text in quotes. Change the words, leave the name before the colon, and keep
// {version}, which the page fills in.
import type { Words } from "../words";

export const infoPages: Words["infoPages"] = {
  data: {
    download: "Descargar los datos",
    noDownload: "La descarga no está disponible en esta copia del sitio.",
  },

  references: {
    versionLabel: "Versión",
    versionOption: "Versión {version}",
    versionOptionCurrent: "Versión {version} (actual)",
    changedFrom: "Qué cambió respecto a la versión {version}",
    quickHeading: "La prueba rápida",
    parameter: "Parámetro",
    value: "Valor",
    source: "Fuente",
  },
};
