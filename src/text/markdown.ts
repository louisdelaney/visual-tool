// Reads the paragraphs in a page's Markdown file (en/contribute.md and the rest).
//
// Each file is a list of named blocks. A line "## measuresIntro" starts the block the code knows
// as measuresIntro, and the text under it, up to the next "##" line, is its words. Anything in
// <!-- --> is a note for whoever edits the file and is never shown.
//
// Inside a block:
//   - a blank line starts a new paragraph; line breaks within a paragraph are just spaces
//   - lines starting with "- " or "1. " are a list, one item each; a line without one carries on
//     the item above, so long items can be broken over several lines
//   - **bold**, *italic*, <kbd>Esc</kbd> for a key
//   - [words](history) links to another page of the site: history, privacy, references or data
//     (PAGE_LINKS in tags.ts). Any of these works in any block.
//   - {minutes} is a value the page fills in, where the code says it has one
//
// The words come out in the tag form the rest of src/text uses (<strong>, <history-link> and so
// on, see tags.ts), so the pages show them the same way whichever file they came from, and every
// block can be shown anywhere: tags.ts says how each place shows its formatting.
import { PAGE_LINKS } from "./tags";

/** A Markdown file the site can't read, or a block it asks for that isn't there or doesn't fit. */
export class TextError extends Error {
  override name = "TextError";
}

/**
 * Turns Markdown's inline marks into the tags the pages render. A link to a page of the site becomes
 * its tag (<privacy-link>); a link to a web address becomes <web-link>, with the address added to
 * `hrefs`, in order. Throws on a link to a page that doesn't exist, or to a web address where
 * there's nowhere to keep it.
 */
export function inline(s: string, where = "text", hrefs?: string[]): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\(([^)]*)\)/g, (_, words: string, to: string) => {
      if (/^https:\/\//.test(to) && hrefs) {
        hrefs.push(to);
        return `<web-link>${words}</web-link>`;
      }
      if (!(PAGE_LINKS as readonly string[]).includes(to)) throw new TextError(`${where}: [${words}](${to}) links to no page; use ${PAGE_LINKS.join(", ")}${hrefs ? " or an https:// address" : ""}`);
      return `<${to}-link>${words}</${to}-link>`;
    });
}

const LIST_ITEM = /^(?:-|\d+\.)\s+/;

/** A list's items, if these lines are one: each "- " or "1. " line starts an item, and a line without one carries on the item above. */
function listItems(lines: string[]): string[] | null {
  if (!lines.length || !LIST_ITEM.test(lines[0]!)) return null;
  const items: string[] = [];
  for (const line of lines) {
    if (LIST_ITEM.test(line)) items.push(line.replace(LIST_ITEM, ""));
    else items[items.length - 1] += ` ${line}`;
  }
  return items;
}

interface Block {
  /** Each paragraph, or each list item, already in tag form. */
  parts: string[];
  isList: boolean;
}

/** Every block in a Markdown file, by name. */
export function parseBlocks(source: string, file: string): Map<string, Block> {
  const blocks = new Map<string, Block>();
  const lines = source.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/);
  let name: string | null = null;
  let body: string[] = [];
  const finish = () => {
    if (name == null) {
      if (body.some(l => l.trim())) throw new TextError(`${file}: text before the first "##" line`);
      return;
    }
    if (blocks.has(name)) throw new TextError(`${file}: "## ${name}" appears twice`);
    const paragraphs = body.join("\n").trim().split(/\n\s*\n/).map(p => p.split("\n").map(l => l.trim()).filter(Boolean));
    if (!paragraphs[0]?.length) throw new TextError(`${file}: "## ${name}" has no text`);
    const items = paragraphs.length === 1 ? listItems(paragraphs[0]) : null;
    const isList = items != null;
    const parts = items ?? paragraphs.map(p => p.join(" "));
    blocks.set(name, { parts: parts.map(p => inline(p, `${file}: ${name}`)), isList });
  };
  for (const line of lines) {
    const heading = /^##\s+(\S+)\s*$/.exec(line);
    if (heading) {
      finish();
      name = heading[1];
      body = [];
    } else if (line.startsWith("#")) {
      throw new TextError(`${file}: "${line.trim()}" isn't a block heading; a block starts with "## " and one name, like "## intro"`);
    } else {
      body.push(line);
    }
  }
  finish();
  return blocks;
}

/** Fills each {name} in `template` with its value. Every {name} must be given one. */
export function fill(template: string, values: Record<string, string | number>, where = "text"): string {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, key: string) => {
    if (!(key in values)) throw new TextError(`${where}: nothing fills {${key}}`);
    return String(values[key]);
  });
}

/** Every paragraph read from a Markdown file, so a test can tell them from the .ts files' text. */
const fromMarkdown = new Set<string>();
export const isFromMarkdown = (s: string): boolean => fromMarkdown.has(s);

/** Every block name read so far, by file, so a test can find blocks nothing uses. */
const used = new Map<string, { names: Set<string>; all: string[]; sealed: boolean }>();

/**
 * Called once all the text has loaded (text/index.ts). Reading a block from one of the files after
 * that, from inside a function, throws: otherwise a missing block would only fail when that
 * function first ran.
 */
export const sealMarkdown = (): void => { for (const record of used.values()) record.sealed = true; };

/** Names in each file that no part of the site reads. */
export function unusedBlocks(): string[] {
  return [...used].flatMap(([file, { names, all }]) => all.filter(n => !names.has(n)).map(n => `${file}: ${n}`));
}

/**
 * The blocks of one Markdown file, for its page in src/text/wiring to read by name.
 *   md("name")            one paragraph
 *   md.paragraphs("name") several paragraphs
 *   md.list("name")       the items of a list
 *   md.template("name")   a paragraph with {values}: call the result with them
 * Read every block as the text is built (src/text/wiring), never inside a function there: then a
 * missing block, or one of the wrong shape, throws as the site loads and the unit tests catch it.
 */
export function markdown(source: string, file: string) {
  const blocks = parseBlocks(source, file);
  const record = { names: new Set<string>(), all: [...blocks.keys()], sealed: false };
  used.set(file, record);
  const get = (name: string, shape: "paragraph" | "paragraphs" | "list"): string[] => {
    if (record.sealed) throw new TextError(`${file}: "## ${name}" is read inside a function; read it as the text is built, at the top of its page in src/text/wiring/`);
    const block = blocks.get(name);
    if (!block) throw new TextError(`${file}: no "## ${name}" block`);
    if ((shape === "list") !== block.isList) throw new TextError(`${file}: "## ${name}" ${block.isList ? "is" : "isn't"} a list`);
    if (shape === "paragraph" && block.parts.length > 1) throw new TextError(`${file}: "## ${name}" should be one paragraph`);
    record.names.add(name);
    for (const part of block.parts) fromMarkdown.add(part);
    return block.parts;
  };
  const md = (name: string): string => get(name, "paragraph")[0];
  md.paragraphs = (name: string): string[] => get(name, "paragraphs");
  md.list = (name: string): string[] => get(name, "list");
  md.template = (name: string) => {
    const template = md(name);
    return (values: Record<string, string | number>) => fill(template, values, `${file}: ${name}`);
  };
  return md;
}

/** One Markdown file's blocks, ready to be read by name. */
export type Md = ReturnType<typeof markdown>;

// ---- Whole pages ----
//
// A long page (privacy.md, data.md, references.md) is one Markdown document that reads like the page:
//   # Title            the page's title, once, at the top
//   ## Heading         a section
//   paragraphs and lists as in a block above, plus `code` and [words](https://...) for a web address
//   {name}             alone on a line: a part the page draws from code, like a table or a button
// A list straight under the title is shown as the page's key points.

/** Some words with their formatting, and the web addresses of their <web-link>s, in order. */
export interface Words {
  text: string;
  hrefs: string[];
}

export type DocBlock =
  | { kind: "title"; words: Words }
  | { kind: "heading"; words: Words }
  | { kind: "paragraph"; words: Words }
  | { kind: "list"; items: Words[]; keyPoints: boolean }
  | { kind: "part"; name: string };

/**
 * A whole page from its Markdown file. `parts` are the {name} lines the page draws, each needed
 * exactly once; `values` are the {name}s it fills in within a sentence.
 */
export function document(source: string, file: string, { parts = [], values = [] }: { parts?: string[]; values?: string[] } = {}): DocBlock[] {
  const out: DocBlock[] = [];
  const words = (s: string): Words => {
    const hrefs: string[] = [];
    const text = inline(s, file, hrefs);
    for (const [, name] of text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)) {
      if (!values.includes(name!)) throw new TextError(`${file}: nothing fills {${name}}${values.length ? `; use ${values.map(v => `{${v}}`).join(", ")}` : ""}`);
    }
    return { text, hrefs };
  };
  // A heading or a {part} is a chunk of its own; other lines group into paragraphs and lists,
  // split by blank lines.
  const chunks: string[][] = [[]];
  for (const line of source.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
    if (!line.trim()) chunks.push([]);
    else if (/^#{1,2}\s/.test(line) || /^\{[a-zA-Z][a-zA-Z0-9]*\}\s*$/.test(line)) chunks.push([line], []);
    else if (line.startsWith("#")) throw new TextError(`${file}: "${line.trim()}" isn't a heading; a page has one "# Title" and "## Heading" sections, nothing deeper`);
    else chunks[chunks.length - 1]!.push(line);
  }
  for (const chunk of chunks) {
    const lines = chunk.map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const first = lines[0]!;
    if (first.startsWith("# ")) {
      if (out.length) throw new TextError(`${file}: the "#" title must come first, and only once`);
      out.push({ kind: "title", words: words(first.slice(2).trim()) });
    } else if (first.startsWith("## ")) {
      out.push({ kind: "heading", words: words(first.slice(3).trim()) });
    } else if (/^\{[a-zA-Z][a-zA-Z0-9]*\}$/.test(first)) {
      const name = first.slice(1, -1);
      if (!parts.includes(name)) throw new TextError(`${file}: the page has no part {${name}}${parts.length ? `; use ${parts.map(p => `{${p}}`).join(", ")}` : ""}`);
      if (out.some(b => b.kind === "part" && b.name === name)) throw new TextError(`${file}: {${name}} appears twice`);
      out.push({ kind: "part", name });
    } else if (listItems(lines)) {
      out.push({ kind: "list", items: listItems(lines)!.map(words), keyPoints: out.length === 1 && out[0]!.kind === "title" });
    } else {
      if (lines.some(l => LIST_ITEM.test(l))) throw new TextError(`${file}: a list needs a blank line before and after it: "${first}"`);
      out.push({ kind: "paragraph", words: words(lines.join(" ")) });
    }
  }
  if (out[0]?.kind !== "title") throw new TextError(`${file}: the page needs a "#" title at the top`);
  for (const name of parts) if (!out.some(b => b.kind === "part" && b.name === name)) throw new TextError(`${file}: {${name}} is missing; the page needs it on a line of its own`);
  return out;
}
