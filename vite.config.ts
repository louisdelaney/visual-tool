/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

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

export default defineConfig(({ mode }) => ({
  plugins: [react(), contentSecurityPolicy(loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL ?? "")],
  // Relative asset paths, so the build works under GitHub Pages' /visual-tool/ path or any other.
  base: "./",
  // Never inline assets as data: URLs: the security policy allows files from this site only.
  build: { assetsInlineLimit: 0 },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
}));
