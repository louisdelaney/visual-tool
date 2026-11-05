// The short words on the long pages. The pages themselves are privacy.md, references.md and
// data.md, each written as it appears.
//
// This file is only words: every entry is plain text in quotes. Change the words between the
// quotes, and leave the name before the colon as it is. {version} is a number the page fills in.

export const infoPages = {
  // The Data page.
  data: {
    download: "Download the data",
    noDownload: "The download isn't available on this copy of the site.",
  },

  // Method and references.
  references: {
    // The version picker: its label, and each version in it, the current one marked.
    versionLabel: "Version",
    versionOption: "Version {version}",
    versionOptionCurrent: "Version {version} (current)",
    changedFrom: "What changed from version {version}",
    quickHeading: "The quick test",
    // The table's column headings.
    parameter: "Parameter",
    value: "Value",
    source: "Source",
  },
};
