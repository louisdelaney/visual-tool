// The shape of the tables on Method and references, the same in every language. The words are in
// each language's method.ts; the papers, which are cited as published, are in components/methodData.ts.

export interface ProtocolRow {
  parameter: string;
  value: string;
  source: string;
}

export interface ProtocolGroup {
  title: string;
  rows: ProtocolRow[];
}

/** One version of the test (TEST_VERSION): what it was, and its task parameters. */
export interface MethodVersion {
  version: number;
  /** When it ran, and how its results are kept. */
  about: string;
  /** What changed from the version before, if there was one. */
  changes: string[];
  /** The quick test, if this version had one: the same test with fewer trials. */
  quick?: { about: string; differences: string[] };
  tasks: ProtocolGroup;
}
