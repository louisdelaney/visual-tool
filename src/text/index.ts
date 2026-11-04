// All the words on the site. The English is in en/, one file per page or part of the site;
// components read it from `text`, so wording can change without touching layout or logic.
// Inline formatting inside a sentence is written as tags: see tags.ts and Rich.tsx.
import { en } from "./en";
import { sealMarkdown } from "./markdown";

export type Text = typeof en;

export const text: Text = en;

// Every Markdown block is read by now; one read later, inside a function, would only fail when
// that function first ran, so it throws straight away instead (and the unit tests call them all).
sealMarkdown();
