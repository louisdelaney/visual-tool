// The three long pages: Privacy and risks, Method and references, and Data. Each page's words are
// one Markdown file that reads like the page; these are the short words the pages draw around them.
import { document, fill } from "../markdown";
import type { Language } from "../languages";
import type { Sources, Words } from "../words";

export const infoPages = (w: Words, sources: Sources, language: Language) => {
  const { data, references: { versionOption, versionOptionCurrent, ...references } } = w.infoPages;
  return {
    privacy: document(sources.privacy, `${language}/privacy.md`),
    data: { page: document(sources.data, `${language}/data.md`, { parts: ["download"] }), ...data },
    references: {
      page: document(sources.references, `${language}/references.md`, { parts: ["versionPicker", "version", "groups", "protocol", "references"], values: ["minGroup"] }),
      ...references,
      /** Each version in the version picker: "Version 2 (current)". */
      versionOption: (version: number, current: boolean) => fill(current ? versionOptionCurrent : versionOption, { version }),
      changedFrom: (version: number) => fill(references.changedFrom, { version }),
    },
  };
};
