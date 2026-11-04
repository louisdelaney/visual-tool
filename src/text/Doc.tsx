// Shows a whole page from its Markdown file (document() in markdown.ts): the title, the sections,
// the paragraphs and lists, and the parts the page draws from code where the file puts them.
import { Fragment, type ReactNode } from "react";
import type { DocBlock, Words } from "./markdown";
import { fill } from "./markdown";
import { Rich } from "./Rich";

interface DocProps {
  blocks: readonly DocBlock[];
  /** The title's id, for the page's aria-labelledby. */
  titleId: string;
  /** What each {name} line shows. */
  parts?: Record<string, ReactNode>;
  /** What each {name} within a sentence becomes. */
  values?: Record<string, string | number>;
}

export function Doc({ blocks, titleId, parts = {}, values = {} }: DocProps) {
  const words = (w: Words) => <Rich text={fill(w.text, values)} hrefs={w.hrefs} />;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "title": return <h2 key={i} id={titleId}>{words(b.words)}</h2>;
          case "heading": return <h3 key={i}>{words(b.words)}</h3>;
          case "paragraph": return <p key={i}>{words(b.words)}</p>;
          case "list": return <ul key={i} className={b.keyPoints ? "key-points" : undefined}>{b.items.map((w, j) => <li key={j}>{words(w)}</li>)}</ul>;
          case "part": return <Fragment key={i}>{parts[b.name]}</Fragment>;
        }
      })}
    </>
  );
}
