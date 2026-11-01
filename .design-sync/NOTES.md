# design-sync notes — visual-tool

Repo-specific gotchas for syncing this repo to claude.ai/design. Read this before a re-sync.

## What this repo is

- **Not a design-system library.** It's a private Vite app: no `main`/`module`/`exports`, `private: true`,
  and `dist/` is an app build, not a component build. There is no `.d.ts` tree, so the converter's normal
  "components = PascalCase exports in the shipped `.d.ts`" discovery finds nothing.
- Components are therefore discovered **only** from `cfg.componentSrcMap`, which pins each one to its
  source file. **Adding a component to the sync means adding it to `componentSrcMap` AND to
  `.design-sync/ds-entry.tsx`** — neither alone is enough.

## The hand-written entry (`.design-sync/ds-entry.tsx`) — do not remove

With no built entry the converter falls back to synthesizing one that does `export * from` **every**
`.tsx` under `src/`. That includes `src/main.tsx`, which at module load calls `initStage()`,
`initRouting()` and `createRoot(...).render(...)`, and throws `#app is missing from index.html`.
That would break `_ds_bundle.js` for every preview and every generated design.

So the build is always run with an explicit entry:

```sh
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry .design-sync/ds-entry.tsx --out ./ds-bundle
```

**`--entry` is not a config field — it must be passed on the command line every time.**

The barrel also exports `NO_CHIPS`, `MAX_CHIPS`, `MAX_CHIP_LENGTH` and `chipValues` alongside the five
components: previews and generated designs import from the package name (shimmed to `window.VisualTool`),
so anything a consumer needs to use `ChipInput` has to be an actual bundle export. They are not
PascalCase-matching, so they never become component cards.

## Scope

Synced: `ChipInput`, `Footer`, `FunNotice`, `Masthead`, `Stepper` — the form and page-chrome parts.

Deliberately **not** synced (maintainer's call, 2026-11-01): `GroupComparison`, `HistoryChart`,
`StaircaseChart` (results displays governed by the AGENTS.md rules on what the graphs may show) and
`StimulusPreview` (test-page territory, out of the stated design scope). Adding any of them is a
scope decision for the maintainer, not a mechanical one.

## CSS: `cssEntry` is generated, not committed

`cfg.cssEntry` is read **verbatim and appended** to `_ds_bundle.css` — `@import`s inside it are NOT
resolved and would dangle in the uploaded project. The repo's stylesheets live in `src/styles/` as
separate files, and `copyTokens`/`tokensGlob` only works for a package under `node_modules`, so neither
mechanism fits. Instead `cfg.buildCmd` concatenates the real sources into a gitignored
`.design-sync/ds-styles.css`:

```sh
cat src/styles/tokens.css src/styles/base.css src/styles/forms.css .design-sync/preview-surface.css \
  > .design-sync/ds-styles.css
```

Run it before every build. It regenerates from source, so it cannot drift. The files are safe to
concatenate: none of them contains `@import` or `url()`.

Tokens reach the app through the `:root` block of `tokens.css` inside `_ds_bundle.css` (validate reports
"tokens: 32 defined"). `ds-bundle/tokens/` is legitimately empty — there is no tokens package.

## `.design-sync/preview-surface.css` — why `html body` exists

This DS is **dark only**, by an explicit ruling at the top of `src/styles/tokens.css`. The preview card
template in `lib/emit.mjs` hardcodes `<style>body{margin:0;padding:24px;background:#fff}</style>` *after*
the stylesheet link, and `base.css`'s own `html, body { background: var(--bg) }` has the same specificity
(0,0,1), so source order gave it white cards with `#E8EDEA` text — effectively invisible.

`html body` (0,0,2) outranks the inline rule. `emit.mjs` is fork-banned and has no background knob, so
this is the supported fix. It ships to generated designs too, which is correct here: the dark page
surface is part of the system, not preview chrome.

## Known render warns

- `[FONT_MISSING] "Atkinson Hyperlegible"` — **expected, do not chase.** `--font-ui` is
  `"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, …`. The middle entry is a
  locally-installed fallback that the app itself does not bundle either. Both families the project
  actually ships — Atkinson Hyperlegible Next (400/700/800) and Atkinson Hyperlegible Mono (400/500),
  latin + latin-ext — are in `fonts/` and declared in `fonts/fonts.css`. Nothing degrades.

## Other facts worth keeping

- Node pin: `engines.node >= 20.19`. Install with `npm ci` (`package-lock.json`).
- Playwright: the repo pins `playwright@1.64.1`, which wants chromium build **1248**. That build was
  already in `~/Library/Caches/ms-playwright/` (macOS path — not `~/.cache/ms-playwright`), so the render
  check needed no install.
- All five components land in group `general`: they live in `src/components/`, and `components` is in the
  converter's `GENERIC_DIR` set, so the directory name is not used as a group. Regrouping would need
  `cfg.docsMap` stubs carrying a `category:` frontmatter key.
- `Masthead` and `Footer` import `../app/flow`, which pulls the whole stage/task module graph into the
  bundle. It is inert at load (no top-level side effects) and the bundle is still only ~17 KB, but that
  is why the bundle is larger than five small components would suggest.
- `src/app/store.ts` reads `window.location.hash` at module load. Harmless in previews (no hash → no
  state change), but it is a real top-level side effect if anything ever changes there.

## Prop contracts are hand-written (`cfg.dtsPropsFor`) — load-bearing

There is no built `.d.ts` tree, so the ts-morph extractor has nothing to read: left alone it emits
`export interface <Name>Props { [key: string]: unknown }` for all five components. That interface is
exactly what the claude.ai/design agent treats as the API contract, so an empty one means the agent
has no idea `Masthead` needs `view` or that `ChipInput` is controlled.

`cfg.dtsPropsFor` therefore carries a hand-written props body for every component, with the `View`
union and the `Chips` shape inlined (neither type exists in the emitted `.d.ts`, so they cannot be
referenced by name). The no-prop components use a comment-only body — an empty string is falsy and
silently falls back to the `[key: string]: unknown` stub.

**Nothing cross-checks these against the real source.** If a component's props change, `dtsPropsFor`
must be edited by hand or the design agent will code against a stale contract — and the build will
still pass.

## Re-sync risks — what can silently go stale

- **`ds-entry.tsx` vs `componentSrcMap` drift.** They are two independent lists of the same five
  components. A component added to one and not the other either fails to bundle or never gets a card.
- **`--entry` forgotten.** A re-sync that runs `package-build.mjs` without it silently switches to the
  synth entry and ships a bundle that throws on load. The symptom is every preview falling to the floor
  card at once.
- **`preview-surface.css` dropped or `emit.mjs` changing its hardcoded background.** If a future converter
  version stops emitting `body{background:#fff}`, the `html body` rule is harmless; if it raises the
  specificity, cards go white again. Check a contact sheet after any skill upgrade.
- **New app CSS files.** `buildCmd` names `tokens.css`, `base.css` and `forms.css` explicitly. A new
  stylesheet in `src/styles/` that the synced components depend on will not ship until it is added there.
  (`setup.css`, `calibration.css`, `results.css` and `stage.css` are deliberately excluded — they belong
  to pages outside the synced scope.)
- **Grades are campaign-local.** Durable verified-state lives in the uploaded `_ds_sync.json`. If that
  project is deleted or re-created, everything re-verifies from scratch.
- **`dtsPropsFor` drift.** The biggest silent-staleness risk in this config: see the section above.
  On any re-sync, diff `cfg.dtsPropsFor` against the real prop types in `src/components/*.tsx`
  (`View` is in `src/app/types.ts`, `Chips` in `src/components/ChipInput.tsx`).
- **Nothing was only partially verified.** All five components have authored previews; all 14 cells
  were captured and graded `good` from the review sheets, and the render check was full (not sampled).
