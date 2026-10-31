// Typed lookups for the stage's elements, which live in index.html outside the React root.

/** The element with this id, or a thrown error naming it: a missing element is a bug, not a state. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from the page`);
  return el as T;
}

export const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
