// The tags a sentence in src/text may use: <strong>, <em> and <kbd> anywhere, plus names with a
// hyphen, like <history-link>, that the component showing the sentence fills in (usually a link
// or button). Nothing else: no attributes, and no other HTML.
//
// The whole pages' Markdown (privacy.md and the others) can also link to a web address: its
// sentences carry <web-link> and the addresses alongside (Words in markdown.ts).
//
// Every sentence can be shown anywhere, and shows as much of its formatting as the place allows:
//   on a page      everything, through Rich.tsx; a link to one of PAGE_LINKS works on any page
//   on the stage   bold, italic and keys, as HTML; links can't be followed there, so withoutLinks
//   in the PDF     bold, through pdfRuns in app/pdf.ts; the rest as plain words
//   plain text     plainText, for where nothing can show, like an attribute

export const BUILT_IN_TAGS = ["strong", "em", "kbd", "code"] as const;

/** The pages any sentence can link to: "<privacy-link>" in a .ts file, "[words](privacy)" in Markdown. */
export const PAGE_LINKS = ["history", "privacy", "references", "data"] as const;
export type PageLink = (typeof PAGE_LINKS)[number];

export interface TagNode {
  tag: string;
  children: (string | TagNode)[];
}

const TAG = /<(\/?)([a-z][a-z-]*)>/g;

/** Splits a sentence into text and tagged parts. Throws on a tag that isn't closed or closes the wrong one. */
export function parseTags(s: string): (string | TagNode)[] {
  const root: TagNode = { tag: "", children: [] };
  const stack = [root];
  let last = 0;
  for (const m of s.matchAll(TAG)) {
    const top = stack[stack.length - 1]!;
    if (m.index > last) top.children.push(s.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) {
      if (stack.length === 1 || top.tag !== m[2]) throw new Error(`Unmatched </${m[2]}> in: ${s}`);
      stack.pop();
    } else {
      const node: TagNode = { tag: m[2]!, children: [] };
      top.children.push(node);
      stack.push(node);
    }
  }
  if (stack.length > 1) throw new Error(`Unclosed <${stack[stack.length - 1]!.tag}> in: ${s}`);
  if (last < s.length) root.children.push(s.slice(last));
  return root.children;
}

/** The tag names a sentence uses, in order. */
export function tagNames(s: string): string[] {
  return [...s.matchAll(TAG)].filter(m => !m[1]).map(m => m[2]!);
}

/** Whether a tag is allowed: a built-in one, or a hyphenated name a component fills in. */
export const allowedTag = (name: string): boolean => (BUILT_IN_TAGS as readonly string[]).includes(name) || name.includes("-");

/** A sentence with its tags removed, keeping the words. */
export const plainText = (s: string): string => s.replace(TAG, "");

/** A sentence for the stage, which shows HTML: links can't be followed there, so they become their words. */
export const withoutLinks = (s: string): string => s.replace(/<\/?[a-z]+(?:-[a-z]+)*-link>/g, "");
