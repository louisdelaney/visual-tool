/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { INFO_PAGES } from "./src/app/types.ts";
import { markdownText } from "./src/text/markdownPlugin.ts";
import { LANGUAGES, OTHER_LANGUAGES, type Language } from "./src/text/languages.ts";

// The built page may contact only itself and the backend. The browser blocks everything else,
// so no future change can quietly add a tracker, a CDN or a font host. Only added to builds:
// the dev server needs inline scripts for hot reloading.
function contentSecurityPolicy(apiUrl: string): Plugin {
  const api = apiUrl ? new URL(apiUrl).origin : "";
  const policy = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self'",
    `connect-src 'self'${api ? ` ${api}` : ""}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
  return {
    name: "content-security-policy",
    apply: "build",
    transformIndexHtml: html => html.replace(
      "<!-- The build adds a Content Security Policy here (see vite.config.ts). -->",
      `<meta http-equiv="Content-Security-Policy" content="${policy}">`,
    ),
  };
}

// A copy of the page at every address it has, so each loads on a static host like GitHub Pages,
// which can't send every address to one page: each info page (dist/privacy/index.html and so on),
// and each other language's folder with its own info pages (dist/es/, dist/es/privacy/). A copy's
// relative paths point back up to the site's folder, and it says its language and title, so the
// page is right before any script runs.
function pageCopies(): Plugin {
  let outDir = "dist";
  return {
    name: "page-copies",
    apply: "build",
    configResolved: config => { outDir = path.resolve(config.root, config.build.outDir); },
    writeBundle: () => {
      const built = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      const english = { lang: '<html lang="en">', title: `<title>${LANGUAGES.en.title}</title>` };
      if (!built.includes(english.lang) || !built.includes(english.title)) throw new Error("index.html must have <html lang=\"en\"> and the English title for the build to make each language's copy");
      const copy = (folder: string, language: Language): void => {
        const html = built
          .replace(/(src|href)="\.\//g, `$1="${"../".repeat(folder.split("/").length)}`)
          .replace(english.lang, `<html lang="${language}">`)
          .replace(english.title, `<title>${LANGUAGES[language].title}</title>`);
        fs.mkdirSync(path.join(outDir, folder), { recursive: true });
        fs.writeFileSync(path.join(outDir, folder, "index.html"), html);
      };
      for (const page of INFO_PAGES) copy(page, "en");
      for (const language of OTHER_LANGUAGES) {
        copy(language, language);
        for (const page of INFO_PAGES) copy(`${language}/${page}`, language);
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [markdownText, react(), contentSecurityPolicy(loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL ?? ""), pageCopies()],
  // Relative asset paths, so the build works under GitHub Pages' /visual-tool/ path or any other.
  base: "./",
  // Never inline assets as data: URLs: the security policy allows files from this site only.
  // The PDF chunk (pdf-lib and its font code, about 1.1 MB) loads only when someone saves a PDF.
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
}));
