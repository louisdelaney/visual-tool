// The site's words in src/text: every sentence's tags are ones the pages can show, the PDF's text
// has none, no sentence uses a word AGENTS.md rules out for describing results, every block in the
// Markdown files is used, and the Markdown reader reads them as CONTRIBUTING.md says.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { text } from "../../src/text";
import { document, fill, isFromMarkdown, markdown, parseBlocks, sealMarkdown, TextError, unusedBlocks } from "../../src/text/markdown";
import { allowedTag, PAGE_LINKS, parseTags, plainText, tagNames, withoutLinks } from "../../src/text/tags";
import { INFO_PAGES } from "../../src/app/types";

/**
 * Every string in `v` with its path. A function is called with sample values to get its strings.
 * A sample that doesn't suit it (a number where it wants text, say) may throw, but at least one must
 * work, and an error from the Markdown reader always fails: that's a missing or misshapen block.
 */
function strings(v: unknown, path = ""): [string, string][] {
  if (typeof v === "string") return [[path, v]];
  if (typeof v === "function") {
    const fn = v as (...args: unknown[]) => unknown;
    const errors: unknown[] = [];
    const out = [2, 1, true, false, "X"].flatMap(sample => {
      try {
        return strings(fn(...Array<unknown>(fn.length).fill(sample)), path);
      } catch (e) {
        if (e instanceof TextError) throw e;
        errors.push(e);
        return [];
      }
    });
    if (errors.length === 5) throw new Error(`${path}: no sample value works: ${String(errors[0])}`);
    return out;
  }
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => strings(x, path ? `${path}.${k}` : k));
  return [];
}

const all = strings(text);

describe("site text", () => {
  it("has text to check", () => {
    expect(all.length).toBeGreaterThan(100);
  });

  it("closes every tag it opens", () => {
    for (const [path, s] of all) expect(() => parseTags(s), path).not.toThrow();
  });

  it("uses only <strong>, <em>, <kbd> and hyphenated tags, with no other HTML", () => {
    for (const [path, s] of all) {
      for (const name of tagNames(s)) expect(allowedTag(name), `<${name}> in ${path}`).toBe(true);
      expect(s.replace(/<\/?[a-z][a-z-]*>/g, ""), path).not.toMatch(/<[a-zA-Z!/]/);
    }
  });

  it("has no tags in pdf.ts, whose words the PDF draws as they are", () => {
    // The PDF shows its Markdown paragraphs' bold (pdfRuns in app/pdf.ts); its own labels are plain.
    for (const [path, s] of strings(text.pdf, "pdf")) if (!isFromMarkdown(s)) expect(tagNames(s), path).toEqual([]);
  });

  it("links only to pages that exist", () => {
    expect([...PAGE_LINKS].sort()).toEqual([...INFO_PAGES].sort());
    for (const [path, s] of all) {
      for (const name of tagNames(s)) if (name.endsWith("-link") && name !== "web-link") expect(PAGE_LINKS, `<${name}> in ${path}`).toContain(name.slice(0, -"-link".length));
    }
  });

  it("uses no words that judge a result", () => {
    const judging = /\b(ab)?normal\b|\btypical\b|\bhealthy\b|\bimpaired\b|\bat risk\b|\b(below|above) most people\b/i;
    for (const [path, s] of all) expect(s, path).not.toMatch(judging);
  });
});

describe("the Markdown files", () => {
  it("has no block that nothing on the site reads", () => {
    expect(unusedBlocks().filter(b => !b.startsWith("test.md"))).toEqual([]);
  });

  it("stops a block being read from inside a function, where a missing one would go unnoticed", () => {
    const md = markdown("## a\nText.", "test.md");
    const later = () => md("a");
    sealMarkdown();
    expect(later).toThrow("read inside a function");
  });

  it("reads paragraphs, lists, marks and links into the pages' tags", () => {
    const md = markdown([
      "<!-- A note that's never shown. -->",
      "## one",
      "",
      "A sentence split",
      "over two lines, with **bold**, *italic*, <kbd>Esc</kbd> and [a link](privacy).",
      "",
      "## two",
      "First paragraph.",
      "",
      "<!-- Between paragraphs. -->",
      "Second paragraph.",
      "## steps",
      "1. Do this.",
      "2. Then that.",
      "## bullets",
      "- Here",
      "- There",
      "## sum",
      "{a} and {b}.",
    ].join("\n"), "test.md");
    expect(md("one")).toBe("A sentence split over two lines, with <strong>bold</strong>, <em>italic</em>, <kbd>Esc</kbd> and <privacy-link>a link</privacy-link>.");
    expect(md.paragraphs("two")).toEqual(["First paragraph.", "Second paragraph."]);
    expect(md.list("steps")).toEqual(["Do this.", "Then that."]);
    expect(md.list("bullets")).toEqual(["Here", "There"]);
    expect(md.template("sum")({ a: 1, b: "two" })).toBe("1 and two.");
  });

  it("stops the site loading when a block is missing or the wrong shape", () => {
    const md = markdown("## two\nOne.\n\nTwo.\n## list\n- A\n## sum\n{a}", "test.md");
    expect(() => md("missing")).toThrow('test.md: no "## missing" block');
    expect(() => md("two")).toThrow("should be one paragraph");
    expect(() => md("list")).toThrow("is a list");
    expect(() => md.list("two")).toThrow("isn't a list");
    expect(() => md.template("sum")({})).toThrow("nothing fills {a}");
    expect(() => fill("{a}", { a: 1 })).not.toThrow();
  });

  it("shows each place as much formatting as it can", () => {
    const s = "<strong>Bold</strong>, <kbd>Esc</kbd> and <privacy-link>a link</privacy-link>.";
    expect(withoutLinks(s)).toBe("<strong>Bold</strong>, <kbd>Esc</kbd> and a link.");
    expect(plainText(s)).toBe("Bold, Esc and a link.");
    expect(() => markdown("## a\n[words](privcy)", "test.md")).toThrow("links to no page");
  });

  it("rejects a file it can't read", () => {
    expect(() => parseBlocks("Words before any heading.\n## a\nText.", "test.md")).toThrow("before the first");
    expect(() => parseBlocks("## a\nText.\n## a\nAgain.", "test.md")).toThrow("appears twice");
    expect(() => parseBlocks("## a\n\n## b\nText.", "test.md")).toThrow('"## a" has no text');
  });

  it("rejects a heading it would otherwise take for text", () => {
    expect(() => parseBlocks("## two words\nText.", "test.md")).toThrow("isn't a block heading");
    expect(() => parseBlocks("## a\nText.\n### b\nMore.", "test.md")).toThrow("isn't a block heading");
    expect(() => parseBlocks("## a\nText.\n#b\nMore.", "test.md")).toThrow("isn't a block heading");
    expect(() => document("# Title\n\n### Deeper\n\nText.", "test.md")).toThrow("isn't a heading");
    expect(() => document("# Title\n\n#Heading\n\nText.", "test.md")).toThrow("isn't a heading");
    expect(document("# Title\n\n## Heading\n\nText.", "test.md").map(b => b.kind)).toEqual(["title", "heading", "paragraph"]);
  });
});

describe("the backend", () => {
  // It imports the site's schema and group rules, but none of its words, so rewording the site
  // never changes the backend (CONTRIBUTING.md).
  it("never loads src/text", () => {
    const root = path.resolve(__dirname, "../..");
    const text = path.join(root, "src/text");
    const seen = new Set<string>();
    const resolve = (from: string, spec: string): string | null => {
      const base = path.resolve(path.dirname(from), spec);
      for (const f of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
      return null;
    };
    const visit = (file: string, chain: string[]): void => {
      if (seen.has(file)) return;
      seen.add(file);
      expect(file.startsWith(text), [...chain, file].map(f => path.relative(root, f)).join(" → ")).toBe(false);
      for (const [, spec] of fs.readFileSync(file, "utf8").matchAll(/^\s*(?:import|export)\s(?!type\s)[^;]*?from\s+"(\.[^"]+)"/gm)) {
        const next = resolve(file, spec!);
        if (next) visit(next, [...chain, file]);
      }
    };
    const files = fs.readdirSync(path.join(root, "backend/src"), { recursive: true, encoding: "utf8" }).filter(f => f.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) visit(path.join(root, "backend/src", f), []);
  });
});
