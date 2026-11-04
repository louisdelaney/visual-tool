<!--
The Data page, as it appears. "#" is the page's title and "##" starts a section. {download} is the
download button, which the page draws. CONTRIBUTING.md explains the rest.

Keep the description in line with the export job (backend/src/jobs/export.ts) and the README.
-->

# Data

Every result and answer people choose to contribute is free to download, use and investigate, by
anyone, for any purpose.

{download}

## License

The data is licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
You can share and adapt it for any purpose, as long as you mention where it came from, with a link
back to this site.

Please don't try to work out who anyone is. Contributors are anonymous, and some of what they shared
is personal.

## What's in it

- Every contributed session, from every version of the test, with every trial, the screen
  calibration, the test's settings and the answers from the first step.
- Only what's needed to read the results. Each session has the hour it started and how long it
  took, never exact times, and its trials have no times at all. Sessions sent before this was
  tightened are trimmed the same way.
- It's refreshed once a day, so the latest results may take a day to appear.

## Format

The download is one gzipped JSON file, `visual-data.json.gz`, hosted on GitHub. It holds every
session in order of arrival, in the same format as the file you can save from your own results,
plus the date each was received. Each session records its `test_version`; only compare sessions
from the same version, since a new version means the test itself changed. Sessions also record
`test_type`, `"full"` or `"quick"` (none means full). The quick test is a separate, shorter test
with less precise results: keep it apart from the full test.

The results come from people taking a casual online test on their own screens, unsupervised, so
screens, viewing distances and attention vary.

This project only collects and shares the data. It doesn't analyse it or draw conclusions from it.
Any analysis, and what it concludes, is the work of whoever does it, and crediting this site as the
source doesn't mean the project agrees with it.
