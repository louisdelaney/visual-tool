// A .md file imports as its text (see markdownPlugin.ts).
declare module "*.md" {
  const text: string;
  export default text;
}
