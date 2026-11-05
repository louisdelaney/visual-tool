// Which form of a sentence a number takes. Languages differ: English and Spanish use the singular
// only for 1, French also for 0. The browser knows each language's rules, so the wiring asks it
// instead of testing for 1.
//
// Every language has two entries for such a sentence, named ...One and ...Many. A language with
// more forms than that (Russian, Polish, Arabic) needs more entries, and a line here to pick them.

/** For a language's locale: whether `n` takes its singular form. */
export const singularFor = (locale: string): ((n: number) => boolean) => {
  const rules = new Intl.PluralRules(locale);
  return n => rules.select(n) === "one";
};
