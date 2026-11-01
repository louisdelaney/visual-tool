# Building with visual-tool

A small, deliberately plain React + CSS system for one site: a browser vision test. Five components,
one global stylesheet, no framework.

## Setup

**No provider, no theme object, no wrapper component.** Import a component and render it. All styling
comes from `styles.css`; load it once.

**Dark only — do not set your own page background.** The palette is dark by an explicit accessibility
ruling (bright pages are distressing for people with visual perceptual disorders), and `styles.css`
paints `html`/`body` with `var(--bg)`. A light surface, or a background of your own, breaks the system:
`--ink` is `#E8EDEA` and vanishes on white.

**One column.** Page content goes in a single `.wrap` — 780px max-width, centred, `display:flex`,
`flex-direction:column`, `gap:40px`. The page shape is `Masthead` → `<main class="view-stack">` →
`Footer`, all inside that one `.wrap`.

## The styling idiom

Plain **semantic CSS classes from the global stylesheet**, plus **`var(--token)`** custom properties.
There are no utility classes, no CSS-in-JS, and no style/`className` props — the five components take
no styling props at all. For your own layout glue, reuse the class names below; reach for a `var(--*)`
token only when you need a one-off value.

**Tokens** (all defined on `:root`):

| Family | Names |
|---|---|
| Surfaces | `--bg` `--surface` `--surface-2` `--stage` `--stage-panel` |
| Text | `--ink` `--ink-2` `--muted` `--stage-ink` `--stage-dim` |
| Lines | `--rule` `--grid` `--axis` `--field-border` `--stage-rule` |
| Accent | `--accent` `--accent-ink` `--accent-wash` `--stage-accent` `--stage-accent-ink` |
| Signal | `--error` `--warning` `--series-motion` `--series-form` |
| Type | `--font-ui` `--font-data` · `--t-sm` `--t-base` `--t-md` `--t-lg` `--t-xl` |

(`--stage-*` belong to the full-screen black test stage. Don't use them in ordinary page UI.)

**Classes**, by job:

| Job | Classes |
|---|---|
| Layout | `.wrap` `.view-stack` `.panel` `.section-rule` `.actions` `.table-wrap` |
| Type | `.lede` `.hint` `.eyebrow` `.prose` `.key-points` `.checklist` |
| Controls | `.btn` · `.btn.secondary` · `.icon-btn` `.linkish` |
| Forms | `.contrib-form` `.q-section` `.follow-up` `.field-error` `.invalid` `.answer` `.opt` |
| Chips | `.chip-input` `.chips` `.chip` `.chip-add` `.chip-remove` |
| Messages | `.notice` `.fun-notice` `.flash` `.status` |
| A11y | `.visually-hidden` |

Forms use bare `fieldset` / `legend` / `input` / `select` — they are styled globally, so don't wrap them
in extra classed divs.

## Where the truth lives

Read these before styling anything; they beat this summary:

- **`styles.css`** and what it imports — `fonts/fonts.css` and `_ds_bundle.css` (the whole component
  stylesheet: every class above, with its real values).
- **`components/general/<Name>/<Name>.prompt.md`** — per-component props and worked examples.
- **`components/general/<Name>/<Name>.d.ts`** — the prop contract.

## Components

`Masthead` (nav + title + progress, `view` prop) · `Stepper` (progress alone, `view` prop) ·
`Footer` (fixed content) · `FunNotice` (the "just for fun" banner) · `ChipInput` (controlled
list-entry field).

`ChipInput` is controlled and ships its companions as exports: `NO_CHIPS` (the empty value),
`chipValues(value)`, `MAX_CHIPS`, `MAX_CHIP_LENGTH`.

## A build

```jsx
const [meds, setMeds] = useState(NO_CHIPS);

<div className="wrap">
  <Masthead view="contribute" />
  <main className="view-stack">
    <FunNotice />
    <section className="panel">
      <h2>About you</h2>
      <fieldset>
        <legend><label htmlFor="meds">Which medications? (optional)</label></legend>
        <ChipInput id="meds" noun="medication" value={meds} onChange={setMeds} />
        <p className="hint">Add one at a time. Public, like all your answers.</p>
      </fieldset>
      <div className="actions">
        <button className="btn">Continue</button>
        <button className="btn secondary">Back</button>
      </div>
    </section>
  </main>
  <Footer />
</div>
```
