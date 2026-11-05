# Contributing

Thanks for helping. Every change goes through a pull request and is approved by the maintainer before it lands. This page covers how to run things, what to test and what a pull request should include. The README explains how the project works.

## Before you change anything

Read [AGENTS.md](AGENTS.md). It lists the maintainer's rulings: no medical claims, what the graphs may show, the privacy promises, and the rule that there are exactly two fixed types of test, full and quick, never pooled. Every change has to keep them. If your change seems to need one of them to bend, say so in the pull request instead of working around it.

## Running the site

```sh
npm install
npm run dev        # http://localhost:5173
```

With no backend configured, the Contribute step still runs but nothing is sent. The group comparison shows clearly labelled sample data in `npm run dev` only.

## Running the site with the backend

The backend can run in memory, so you don't need a Google Cloud account.

```sh
cd backend
npm install
npm run dev        # port 8080, in memory, allows http://localhost:5173
```

Then copy `.env.example` to `.env.local`, set `VITE_API_URL=http://localhost:8080`, and run `npm run dev` at the top level. Don't use `npm run build` and `vite preview` for this: the built page carries a Content Security Policy that allows only the API origin set when it was built (`vite.config.ts`), so the setting has to be in place at build time.

`npm run dev` keeps sessions in `backend/data/sessions.json` between restarts (the `DATA_FILE` setting); `data/` is ignored by git, so test sessions don't end up in commits. See [backend/README.md](backend/README.md) for every setting.

## With the Firestore emulator (optional, needs Docker)

You never need this to contribute. Memory mode, above, covers everything the site does. The emulator is for checking the Firestore store itself, and `compose.yaml` at the repository root sets it up.

```sh
docker compose up firestore backend      # emulator on :8081, backend on :8080
docker compose run --rm backend-test     # backend tests, including the Firestore emulator tests
docker compose run --rm e2e              # end-to-end tests, in Microsoft's Playwright image
docker compose down
```

The `backend` service is the production image, built from `backend/Dockerfile`, pointed at the emulator (project `demo-visual-tool`). Set `ALLOWED_ORIGIN` if your site isn't at `http://localhost:5173`. Its `http://localhost:8080/export` builds the export file from the emulator's data each time it's opened, so the Data page's download works with no extra step. The `e2e` image has to match the `playwright` version in `package.json`; if you bump one, bump the other.

The emulator's data is kept in the `firestore-data` volume, so it survives restarts and `docker compose down`. The emulator itself holds data in memory only, so `scripts/firestore-emulator.sh` saves a snapshot every minute and when the container stops, keeps the newest five, and loads the newest on start. A crash loses at most the last minute. To start empty, run `docker compose down -v`, which deletes the volume. The backend's Firestore tests each use a new database, and the `backend-e2e` service (below) uses one called `e2e`; snapshots save only the default database, so neither is kept or mixed with the backend's data. (A separate project wouldn't do: this emulator keeps every project's documents together.)

## Offloading to a build server

Also optional. The end-to-end tests take about 10 minutes and want an idle machine, and Docker is heavy on a laptop. If you have a Debian server you can SSH to, `scripts/remote.sh` runs a command there instead.

Once, on the server:

```sh
scp scripts/server-setup.sh <host>:/tmp/ && ssh -t <host> bash /tmp/server-setup.sh
```

This installs rsync and Docker and adds your user to the `docker` group. It uses sudo, which asks for a password, so it needs a terminal (that is what `ssh -t` is for). Log out and in again for the group to apply.

Then set `REMOTE_HOST` to the SSH alias, in your environment or in `.env.local`:

```sh
REMOTE_HOST=debian
```

`scripts/remote.sh <command>` rsyncs the checkout to `REMOTE_DIR` on that host (default `~/visual-tool`) and runs the command there over SSH. With `REMOTE_HOST` unset it just runs the command here, so the same scripts work either way. The npm scripts all go through it:

| Script | What it does |
| --- | --- |
| `npm run backend:up` | Starts the emulator, the backend, and `backend-e2e` for the contribution test. |
| `npm run backend:debug` | Starts the emulator and the backend with Node's debugger (`compose.debug.yaml`). |
| `npm run backend:down` | Stops them. The emulator's data is kept. |
| `npm run backend:logs` | Follows their logs. |
| `npm run check:firestore` | Backend tests, with the Firestore emulator tests included. |
| `npm run check:e2e` | The end-to-end tests. |
| `npm run remote -- <command>` | Any other command. |

To run the end-to-end tests on your own machine with the contribution test using the server's backend, add to `.env.local`:

```sh
E2E_API_URL=http://<server>:8082
E2E_FIRESTORE_URL=http://<server>:8081
```

To develop on a Mac against the server's backend, run `npm run backend:up`, put `VITE_API_URL=http://<server>:8080` in `.env.local`, and run `npm run dev` at the top level as usual. The browser's origin is still `http://localhost:5173`, which the backend allows. It has to be the dev server and not a build, for the Content Security Policy reason given above.

To step through the backend there, start it with `npm run backend:debug` instead and run `ssh -N -L 9229:localhost:9229 <server>`, then attach Chrome DevTools (`chrome://inspect`) or VS Code ("Attach to backend" in `.vscode/launch.json`) to `localhost:9229`. The debugger's port is open only on the server's own loopback, because anyone who can reach it can run code there; the tunnel is the way in. The build emits source maps, so breakpoints go in the TypeScript.

## Tests

```sh
npm run typecheck      # TypeScript, strict
npm test               # site unit tests
npm run test:backend   # backend tests
npm run test:all       # typecheck, both unit suites, then the end-to-end tests
npm run test:e2e       # end-to-end only (about 10 minutes)
```

The end-to-end tests need `npx playwright install chromium` once. They check flash timing, so run them on an otherwise idle machine. They build the site without any `VITE_API_URL` from `.env.local`.

One of them, `tests/e2e/contribute.cjs`, takes the whole test answering Yes to contributing, then checks what the backend stored against what the page exported, and that the page sent no cookies or referrer and contacted nothing else. It needs no setup: with nothing configured it builds the backend and starts it on your machine, in memory, with its data in a temporary folder. To use a backend elsewhere instead, set `E2E_API_URL` and `E2E_FIRESTORE_URL` (see "Offloading to a build server"). `npm run check:e2e` does that for you, using the `backend-e2e` service. The page is served at `http://localhost:4173`, so that port must be free.

To run the slow ones somewhere else, `npm run check:e2e` runs the end-to-end tests and `npm run check:firestore` runs the backend tests with the Firestore emulator tests included. Both go through `scripts/remote.sh`, so they run in Docker, on your build server if `REMOTE_HOST` is set (see "Offloading to a build server"). You don't need either to open a pull request; CI runs the ordinary tests.

Run `npm run test:e2e` if you change anything in `src/core/` or `src/stage/`. For other changes, `npm run typecheck`, `npm test` and `npm run test:backend` are enough, and CI runs them again on the pull request.

## Changing the words on the site

The words on the pages, the test screens and the PDF are in `src/text/en/`, and you don't need to touch the components to change them. Each translation has the same files in a folder beside it (`src/text/es/` for Spanish): see "Translations" below. There are four kinds of file:

- **A page's Markdown file** (`contribute.md`, `results.md`, `tasks.md` and so on) has its paragraphs: introductions, notes, hints, instructions and explanations. It's written to be read and edited without knowing any code, including in GitHub's editor.
- **The TypeScript file with the same name** (`contribute.ts` and so on) has the short words: headings, questions and their answers, buttons, labels on the charts, and short messages like errors. It's only words: every entry is a name, a colon and plain text in quotes.
- **A long page's Markdown file** (`privacy.md`, `references.md`, `data.md`) is the whole page, written as it appears.
- **`labels.ts`** has the short words that appear in more than one place, such as on both results pages and in the PDF: "Motion threshold", "This run", "Save summary (PDF)". Each is written once there, so the places that show it can't drift apart.

None of these files has any code in it. The code that goes with the words is in `src/text/wiring/`, written once for every language: see "Adding a piece of text" below.

The tables on Method and references are in `method.ts`, one row of plain strings for each parameter. The papers, cited as published, are the same in every language and are in `src/components/methodData.ts`.

### Formatting, in every Markdown file

- A blank line starts a new paragraph. A line break inside a paragraph is just a space, so break long lines wherever you like.
- `**bold**` and `*italic*` work as usual, and `<kbd>Esc</kbd>` shows a key.
- `[these words](privacy)` links to another page of the site: `history`, `privacy`, `references` or `data`.
- Lines starting `1.` or `-` are a list. Each starts an item; a line without one carries on the item above.
- `{minutes}`, `{trials}` and the like are filled in by the page. Keep them, and move them anywhere in the sentence.
- `<!-- ... -->` is a note for whoever edits the file, never shown on the site. Many pieces have one saying where they appear, or what they must keep saying.

All of this works in every piece of text, wherever it's shown. Where something can't be shown, its words still are: on the test screens a link shows as its words, since it can't be followed there; in the PDF bold stays bold and the rest shows as plain words.

### A page's Markdown file

Each `## name` line starts one piece of text, and the words under it, up to the next `##` line, are what the page shows in that place. Change the words, but leave the `##` lines as they are: the page finds its text by those names.

### A long page's Markdown file

The file reads like the page: `# Title` once at the top, `## Heading` for each section, then paragraphs and lists. A list straight under the title is shown as the page's key points. These files can also use `` `code` `` and link to a web address with `[words](https://...)`, which opens in a new tab.

A line that's only `{name}`, like `{download}` or `{protocol}`, is a part the page draws from code, such as a button or a table. Move it to change where that part goes, but keep it, once, on a line of its own.

### In a TypeScript file

Every entry looks like this, and only the words between the quotes change:

```ts
sendFailed: "Couldn't send your results. Check your connection and try again.",
```

- `{pseudonym}`, `{n}`, `{cm}` and the like are filled in by the page, as in a Markdown file. Keep them, and move them anywhere in the sentence. The comment above an entry says what a value is when it isn't obvious.
- Where a sentence changes with a number or a situation, there's one entry for each form, such as `sessionsHeadingOne` and `sessionsHeadingMany`, or `removeFailed` and `removeFailedReference`. Write each as a whole sentence.
- Inside a sentence, `<strong>` marks bold and `<kbd>` a key, as in HTML. Nothing else: no other HTML and no attributes. The PDF draws its words as they are, so `pdf.ts` and `labels.ts` have no formatting at all.
- If the words you're looking for aren't in the page's own file, they're in `labels.ts`, because another place shows them too. The test's name is in `src/text/languages.ts`.

### Adding a piece of text

This is the one part that needs code. Add the words to the English file and to each translation, then one line to the page's file in `src/text/wiring/`, which is what the components read:

- A paragraph: a `## name` block in the Markdown file, and `name: md("name")` in the wiring. Blocks are read as the text is built, never inside a function, so a missing one stops the site loading instead of failing later.
- Short words: an entry in the `.ts` file. Plain entries reach the page with no wiring at all.
- A sentence with values: an entry with `{values}`, and in the wiring a function that fills them, like `` lookingUp: (pseudonym: string) => fill(h.lookingUp, { pseudonym }) ``. The components keep calling a typed function, and the words stay plain.
- A sentence with forms: one entry for each, and the wiring picks between them.

`npm test` fails if a value is left unfilled, if a Markdown block isn't used, or if a translation is missing a piece.

### Translations

The site is in English at its own address and in Spanish under `/es/` (`/es/privacy/` and so on). The address alone picks the language: nothing is stored on the device, nothing about it is sent, and a contributed session doesn't record which language it was taken in. The languages are listed in `src/text/languages.ts`.

- `src/text/es/` has the same files as `src/text/en/`, with the same `##` names, the same entries and the same `{values}`. Only the words change. The English files are the list of what a language must provide: each translated file is checked against its English one, so a missing or misspelt entry is an error in that file.
- **Change the translation in the same pull request as the English.** If you can't write Spanish, change the English and say so in the pull request, so someone who can will do the rest before it's merged.
- `npm test` compares each translation with the English piece by piece: every paragraph, list item, table row and section is there, with the same bold, keys, links and `{values}`. It can't tell whether a translation still says what the English now says, or whether it reads well. That needs a fluent reader, so every change to a translation is reviewed by one.
- The instructions on the test screens (`calibration.md`, `tasks.md` and their `.ts` files) must mean exactly what the English means. A translation is the same test, not a new version of it, only while that holds.
- The Spanish uses informal "tú" and words that read naturally in both Spain and Latin America.
- How a language writes numbers is its own choice, in its `common.ts`: `decimal` is the decimal mark, `percent` is a number with its percent sign, and dates follow `locale`. Which numbers count as singular also follows `locale`: English and Spanish use the singular only for 1, French for 0 as well, and the sentence's `...One` or `...Many` entry is picked to match. A language with more than two forms needs more entries, and a line in `src/text/wiring/plural.ts`.
- Punctuation belongs to the words, not the code. Where a name appears inside a sentence, or a label comes before a value, the language has an entry for exactly that, so nothing is lower-cased or given a colon behind its back.
- Field names and values in the exported data stay in English in every language.
- To add a language: add it to `src/text/languages.ts`, copy `src/text/es/` to a folder named after it and translate it (the Spanish files already carry the type that checks them), add it to `OTHERS` in `src/text/index.ts`, give it a list of judging words in `tests/unit/text.test.ts`, and add it to the languages in `tests/e2e/layout.cjs`. The compiler and `npm test` name each of these until it's done. The pages are laid out left to right: a right-to-left language needs layout work first.

### For all of them

- The wording rulings in `AGENTS.md` apply to every line, in every language: no medical claims, and nothing that judges a result.
- `npm test` checks the text (`tests/unit/text.test.ts`): every piece the site needs is there and each one is used, every link goes to a page that exists, the long pages have their parts, the formatting is one the pages can show, and the most common judging words are caught. A mistake in a Markdown file names the file and the piece.
- Rewording instructions on the test screens (`calibration.md`, `tasks.md`, and their `.ts` files) can change how people answer: see the next section.

## Test version and schema version

- If you change what participants see or do (timings, sizes, dot counts, the staircase, instructions that could change answers), it is a different test. Bump `TEST_VERSION` in `src/core/protocol.ts`. A unit test pins the parameters, so forgetting fails.
- If you change the shape of the exported JSON, bump `schema_version` in `src/app/schema.ts` and update the type and its test. The backend keeps accepting the previous version from pages that were open before a deploy. Changes to the backend's validation or the Privacy and risks page usually follow.
- Never pool results across test versions.

## The backend shares code with the site

The backend imports `src/app/schema.ts`, `src/app/comparison.ts` and `src/app/history.ts` on purpose, so validation and the group rules can't drift from the page. Keep those files free of browser dependencies (if `history.ts` ever needs one, move `normalizePseudonym` into `src/core/`), and free of the site's words: the wording for the groups and for how a run was taken is in `src/app/groupText.ts` and `src/app/runText.ts`, which read `src/text`, so rewording the site never touches the backend. `tests/unit/text.test.ts` checks it.

The backend must keep the privacy rules in the README's "Privacy rules the backend must keep": no IP addresses, no request headers, no request logs, nothing stored beyond the session. A change that touches what's collected or sent also updates the Privacy and risks page, `src/text/en/privacy.md`.

## Deploying your own copy

You can run your own backend and site from a fork. You need a Google Cloud project with billing linked. At a few hundred sessions a day the expected cost is well under $1 a month, and Terraform creates a $5 budget alert. Nothing shuts the service off automatically.

Follow [infra/README.md](infra/README.md). Resource names come from the `name_prefix` Terraform variable (default `visual-tool`), so you get `<prefix>-api`, `<prefix>-export` and so on.

A fork can't affect the maintainer's deployment. The Workload Identity Federation condition in `infra/iam.tf` accepts only this repository's `main` branch, and `.github/workflows/deploy-backend.yml` is skipped until the repository variable `WIF_PROVIDER` is set. Your fork deploys to your own project once you set the variables in `infra/README.md` (`infra/set-github-vars.sh` sets them from `terraform output`).

## Pull requests

A pull request should include:

- What changed and why, in plain English, and which rulings in `AGENTS.md` it touches, if any.
- Tests for new behaviour, and the test commands you ran. Say if you ran `npm run test:e2e`, and if a `TEST_VERSION` or `schema_version` bump is included or deliberately not needed.
- Updates to the README or `backend/README.md` when behaviour or settings change, and to the Privacy and risks page when collection changes.
- No real people's results: don't commit exported sessions, `.env.local`, `.tfvars` files or Terraform state.

Keep each pull request to one thing. The maintainer may ask for changes, and CI must pass before it can be merged.
