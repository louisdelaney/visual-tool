// The site's words in src/text, in every language: every sentence's tags are ones the pages can
// show, the PDF's text has none, no sentence uses a word AGENTS.md rules out for describing
// results, every block in the Markdown files is used, the Markdown reader reads them as
// CONTRIBUTING.md says, and each translation has the same pieces as the English.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { text, type Text } from "../../src/text";
import { words as enWords } from "../../src/text/en";
import { es, words as esWords } from "../../src/text/es";
import type { Words } from "../../src/text/words";
import { LANGUAGES, type Language } from "../../src/text/languages";
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

/** Every language's words. `text` is the English until a page asks for another (src/text/index.ts). */
const TEXTS: Record<Language, Text> = { en: text, es };
/** Every language's own files: the plain words that wiring/ builds the above from. */
const WORDS: Record<Language, Words> = { en: enWords, es: esWords };
// The Spanish files loaded after the English was sealed: seal them too, so a block read inside a
// function throws when the walk below calls it.
sealMarkdown();

/**
 * Words AGENTS.md rules out for describing a result, in each language. Tests can't check meaning:
 * this only catches the commonest ones, so a translation still needs reading by someone fluent.
 */
const JUDGING: Record<Language, RegExp> = {
  en: /\b(ab)?normal\b|\btypical\b|\bhealthy\b|\bimpaired\b|\bat risk\b|\b(below|above) most people\b/i,
  es: /\ba?normal(es|mente)?\b|\ba?t[ií]pic[oa]s?\b|\bsan[oa]s?\b|\bsaludables?\b|\bdeteriorad[oa]s?\b|\ben riesgo\b|\bpor (debajo|encima) de la mayor[ií]a\b/i,
};

describe.each(Object.keys(LANGUAGES) as Language[])("site text (%s)", language => {
  const all = strings(TEXTS[language]);

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
    for (const [path, s] of strings(TEXTS[language].pdf, "pdf")) if (!isFromMarkdown(s)) expect(tagNames(s), path).toEqual([]);
  });

  it("links only to pages that exist", () => {
    expect([...PAGE_LINKS].sort()).toEqual([...INFO_PAGES].sort());
    for (const [path, s] of all) {
      for (const name of tagNames(s)) if (name.endsWith("-link") && name !== "web-link") expect(PAGE_LINKS, `<${name}> in ${path}`).toContain(name.slice(0, -"-link".length));
    }
  });

  it("uses no words that judge a result", () => {
    for (const [path, s] of all) expect(s, path).not.toMatch(JUDGING[language]);
  });

  it("keeps the language's .ts files to plain words: text in quotes, and nothing that runs", () => {
    // They're the files for people who don't program (CONTRIBUTING.md); the code is in src/text/wiring.
    const check = (v: unknown, at: string): void => {
      if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) check(x, at ? `${at}.${k}` : k);
      else if (typeof v !== "number") expect(typeof v, at).toBe("string");
    };
    check(WORDS[language], "");
    // The labels are shown in the PDF as well as on the pages, so they carry no formatting.
    for (const [name, value] of Object.entries(WORDS[language].labels)) expect(tagNames(value), `labels.${name}`).toEqual([]);
  });

  it("fills every {value}: none is left showing on a page", () => {
    // The long pages keep theirs for the page to fill (Doc.tsx); everywhere else a leftover is a
    // value the wiring doesn't know, such as a misspelt name.
    for (const [path, s] of all) if (!/^infoPages\.(privacy|data\.page|references\.page)\./.test(path)) expect(s, path).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
  });
});

// A translation is checked against the English piece by piece, so one that falls behind fails here
// rather than quietly showing less. What a test can't see is a piece that's there but out of date:
// CONTRIBUTING.md asks for the translations to change in the same pull request as the English.
describe.each((Object.keys(LANGUAGES) as Language[]).filter(l => l !== "en"))("the %s translation", language => {
  /** For each piece of text, by its path: the formatting it uses and the {values} left for the page to fill. */
  const pieces = (t: Text): Map<string, { tags: Set<string>; values: Set<string> }> => {
    const out = new Map<string, { tags: Set<string>; values: Set<string> }>();
    for (const [path, s] of strings(t)) {
      // A web address can differ by language (a licence's own translation); the link's place can't.
      if (/\.hrefs\.\d+$/.test(path)) continue;
      const piece = out.get(path) ?? { tags: new Set<string>(), values: new Set<string>() };
      piece.tags.add(tagNames(s).sort().join(" "));
      for (const v of s.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) ?? []) piece.values.add(v);
      out.set(path, piece);
    }
    return out;
  };
  const english = pieces(text), translated = pieces(TEXTS[language]);

  it("has every piece of the English, and no others: every paragraph, list item, table row and section", () => {
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("keeps each piece's formatting: the same bold, keys and links", () => {
    for (const [path, piece] of english) expect([...(translated.get(path)?.tags ?? [])].sort(), path).toEqual([...piece.tags].sort());
  });

  it("keeps each {value} the page fills in", () => {
    for (const [path, piece] of english) expect([...(translated.get(path)?.values ?? [])].sort(), path).toEqual([...piece.values].sort());
    // A template's values are filled by the time it's read above, so its Markdown is compared directly.
    const folder = path.resolve(__dirname, "../../src/text");
    const wholePages = ["privacy.md", "references.md", "data.md"];
    for (const file of fs.readdirSync(path.join(folder, "en")).filter(f => f.endsWith(".md") && !wholePages.includes(f))) {
      const blocks = (lang: string) => parseBlocks(fs.readFileSync(path.join(folder, lang, file), "utf8"), `${lang}/${file}`);
      const theirs = blocks(language);
      for (const [name, block] of blocks("en")) {
        const values = (parts: string[] | undefined): string[] => [...new Set((parts ?? []).join(" ").match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) ?? [])].sort();
        expect(values(theirs.get(name)?.parts), `${language}/${file}: ${name}`).toEqual(values(block.parts));
      }
    }
  });

  it("keeps each {value} in the .ts files' sentences, where the page fills it in", () => {
    const values = (w: unknown, at = ""): [string, string][] => {
      if (typeof w === "string") return [[at, [...new Set(w.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) ?? [])].sort().join(" ")]];
      if (w && typeof w === "object") return Object.entries(w).flatMap(([k, x]) => values(x, at ? `${at}.${k}` : k));
      return [];
    };
    expect(values(WORDS[language])).toEqual(values(enWords));
  });

  it("describes the same versions of the test", () => {
    expect(TEXTS[language].method.versions.map(v => v.version)).toEqual(text.method.versions.map(v => v.version));
  });
});

describe("what a language is free to decide", () => {
  it("takes the singular where the language does, not only for 1", () => {
    // English and Spanish: only 1. The browser's rules decide, so French's "0 session" needs no code.
    expect(text.history.selectedCount(1)).toContain("session selected");
    expect(text.history.selectedCount(0)).toContain("sessions selected");
    expect(text.history.selectedCount(2)).toContain("sessions selected");
    expect(es.history.selectedCount(1)).toContain("sesión seleccionada");
    expect(es.history.selectedCount(0)).toContain("sesiones seleccionadas");
    expect(text.charts.groups.line("who", 1)).toBe("who. 1 person so far.");
    expect(text.history.run.missedChecks(1)).toMatch(/^One of/);
    expect(text.history.run.missedChecks(3)).toMatch(/^3 of/);
  });

  it("writes a name inside a sentence, a percentage and a label before a value its own way", () => {
    expect(text.charts.bars.barTip("This run", "motion", "0.098")).toBe("This run, motion: 0.098");
    expect(es.charts.bars.barTip("Esta sesión", "diff", "0,050")).toBe("Esta sesión, movimiento − forma: 0,050");
    expect(text.common.percent("12.5")).toBe("12.5%");
    expect(text.pdf.medications).toBe("Medications: ");
    expect(text.pdf.staircaseSubtitle).toBe("Coherence (%) on each scored trial, log scale.");
    expect(text.history.run.separator).toBe(" · ");
  });

  it("is listed in the layout test, which runs every page in each language", () => {
    // That test is plain JavaScript, so nothing else makes a new language's pages get checked.
    const layout = fs.readFileSync(path.resolve(__dirname, "../e2e/layout.cjs"), "utf8");
    for (const language of Object.keys(LANGUAGES) as Language[]) {
      expect(layout, `tests/e2e/layout.cjs has no entry for "${language}"`).toContain(`lang: "${language}"`);
      expect(layout, `tests/e2e/layout.cjs has the wrong title for "${language}"`).toContain(`title: "${LANGUAGES[language].title}"`);
    }
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
    expect(fill("{p25} to {p75}", { p25: "1", p75: "2" })).toBe("1 to 2");
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
