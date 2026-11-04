// The three long pages: Privacy and risks, Method and references, and Data. Each page's words are
// one Markdown file that reads like the page (privacy.md, references.md, data.md); this file reads
// them, and has the short words the pages draw around them.
import privacySource from "./privacy.md";
import referencesSource from "./references.md";
import dataSource from "./data.md";
import { document } from "../markdown";

export const infoPages = {
  privacy: document(privacySource, "privacy.md"),
  data: {
    page: document(dataSource, "data.md", { parts: ["download"] }),
    download: "Download the data",
    noDownload: "The download isn't available on this copy of the site.",
  },
  references: {
    page: document(referencesSource, "references.md", { parts: ["versionPicker", "version", "groups", "protocol", "references"], values: ["minGroup"] }),
    /** The version picker: its label, and each version in it ("Version 2 (current)"). */
    versionLabel: "Version",
    versionOption: (version: number, current: boolean) => `Version ${version}${current ? " (current)" : ""}`,
    changedFrom: (version: number) => `What changed from version ${version}`,
    quickHeading: "The quick test",
    /** The table's column headings. */
    parameter: "Parameter",
    value: "Value",
    source: "Source",
  },
};
