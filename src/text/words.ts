// The shape of a language's words: whatever the English has. Each language's .ts files are typed
// against it, so a missing or misnamed entry is an error in the file it belongs in.
import type { sources, words } from "./en";

/** Every entry in a language's .ts files, by file: plain text, some with {values} for the page to fill. */
export type Words = typeof words;

/** The text of a language's Markdown files, by file name. */
export type Sources = typeof sources;
