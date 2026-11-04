// Lets Vite and Vitest import a .md file as its text, for src/text/markdown.ts to read. The backend
// never loads src/text (tests/unit/text.test.ts checks), so its build needs nothing of the kind.
export const markdownText = {
  name: "markdown-text",
  transform(code: string, id: string) {
    return id.endsWith(".md") ? { code: `export default ${JSON.stringify(code)};`, map: null } : undefined;
  },
};
