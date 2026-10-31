# Contributing

Thanks for helping. Every change goes through a pull request and is approved by the maintainer before it lands. This page covers how to run things, what to test and what a pull request should include. The README explains how the project works.

## Before you change anything

Read [AGENTS.md](AGENTS.md). It lists the maintainer's rulings: no medical claims, what the graphs may show, the privacy promises, and the rule that everyone takes one fixed test. Every change has to keep them. If your change seems to need one of them to bend, say so in the pull request instead of working around it.

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
docker compose run --rm export           # run the export job once (profile: tools)
docker compose down
```

The `backend` service is the production image, built from `backend/Dockerfile`, pointed at the emulator (project `demo-visual-tool`). Set `ALLOWED_ORIGIN` if your site isn't at `http://localhost:5173`. Exports go to a named volume and are served at `http://localhost:8080/export/`. The `e2e` image has to match the `playwright` version in `package.json`; if you bump one, bump the other.

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
| `npm run backend:export` | Runs the export job once. |
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

## Test version and schema version

- If you change what participants see or do (timings, sizes, dot counts, the staircase, instructions that could change answers), it is a different test. Bump `TEST_VERSION` in `src/core/protocol.ts`. A unit test pins the parameters, so forgetting fails.
- If you change the shape of the exported JSON, bump `schema_version` in `src/app/schema.ts` and update the type and its test. Until the first deploy, don't bump it: version 1 is still being defined, so change it in place. Changes to the backend's validation or the Privacy and risks page usually follow.
- Never pool results across test versions.

## The backend shares code with the site

The backend imports `src/app/schema.ts`, `src/app/comparison.ts` and `src/app/history.ts` on purpose, so validation and the group rules can't drift from the page. Keep those three files free of browser dependencies. If `history.ts` ever needs one, move `normalizePseudonym` into `src/core/`.

The backend must keep the privacy rules in the README's "Privacy rules the backend must keep": no IP addresses, no request headers, no request logs, nothing stored beyond the session. A change that touches what's collected or sent also updates `src/pages/PrivacyPage.tsx`.

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
