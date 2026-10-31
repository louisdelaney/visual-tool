# Backend

The service behind the site's Contribute step, group comparison, User results page and public download. Node 22 and TypeScript, on `node:http`. The endpoints and the privacy rules it keeps are in the root README ("Backend API" and "Privacy rules the backend must keep"). The hosting is in `../infra/`.

## What's in `src/`

- `validate.ts`: checks a posted session: schema, plausible timings and trial counts, capped text.
- `summary.ts`: the small row `/history` reads, and which comparison group a session joins.
- `stats.ts`: percentiles from the per-group value arrays; the `/groups` response.
- `store.ts`: what a store does, so the server and the export job don't care which one is in use.
- `db.ts`: the Firestore store: sessions (gzipped as sent), summaries, `groups/{test_version}`.
- `routes.ts`: the endpoints. `server.ts`: CORS, limits, errors, the server.
- `http.ts`, `ratelimit.ts`, `log.ts`: response and CORS helpers, the per-instance token bucket, error-only logging.
- `jobs/export.ts`: the export job: one gzipped JSON file per month plus `index.json`.

## Two modes

`BACKEND` picks the store. `firestore` is the default when `GOOGLE_CLOUD_PROJECT` is set. `memory` keeps everything in the process, for development and for trying the project without a Google Cloud account. Memory mode is refused on Cloud Run (when `K_SERVICE` is set).

```sh
npm install
npm run dev        # memory mode, port 8080, ALLOWED_ORIGIN=http://localhost:5173
npm run build      # dist/server.js and dist/jobs/export.js
```

| Variable | Used for |
| --- | --- |
| `PORT` | Port to listen on. Cloud Run sets it; 8080 otherwise. |
| `BACKEND` | `firestore` or `memory`. |
| `ALLOWED_ORIGIN` | The site's origin, the only one browsers may call from. |
| `EXPORT_URL` | Where `GET /export` redirects (the public `index.json`). If it and `EXPORT_BUCKET` are both unset, `/export` redirects to the server's own `/export/index.json`. |
| `DATA_FILE` | Memory mode: file to keep sessions in between runs, for example `./data/sessions.json`. |
| `EXPORT_DIR` | Where the export job writes when `EXPORT_BUCKET` is unset (default `./data/export`), with either store. The server serves it at `/export/*`. |
| `GOOGLE_CLOUD_PROJECT` | Firestore mode: the project. |
| `FIRESTORE_DATABASE` | Firestore mode: the database to use. |
| `EXPORT_BUCKET` | The Cloud Storage bucket the export job writes to. When it is set, `EXPORT_DIR` is not used. |

The export job picks its sink from `EXPORT_BUCKET`, not from the store: a bucket if it is set, otherwise `EXPORT_DIR`. On Cloud Run the job gets `EXPORT_BUCKET` and the service gets `EXPORT_URL`, so `/export` redirects to the public bucket.

`data/` is ignored by git, so don't keep sessions anywhere else in the repository.

## Docker

`Dockerfile` is multi-stage and builds from a plain checkout, with no `npm run build` first. The build context is the repository root, not `backend/`, because the backend imports `../src/app/*`:

```sh
docker build -f backend/Dockerfile .      # from the repository root
```

CI builds it on every push, and `.github/workflows/deploy-backend.yml` builds and pushes it on pushes to `main`. The image runs the server; the export job runs the same image with a different command.

`compose.yaml` at the repository root runs it with a Firestore emulator. None of it is needed for memory mode.

| Service | What it is |
| --- | --- |
| `firestore` | The Firestore emulator on 8081, project `demo-visual-tool`. Data is in memory only, so `docker compose down` loses it. |
| `backend` | The production image on 8080, pointed at the emulator. `ALLOWED_ORIGIN` defaults to `http://localhost:5173`. Exports are written to a named volume and served at `/export/*`. |
| `export` | Runs the export job once (profile `tools`). |
| `backend-test` | The backend tests, including the Firestore emulator tests (profile `checks`). |
| `e2e` | The Playwright end-to-end tests in Microsoft's Playwright image, which must match the `playwright` version in the root `package.json` (profile `checks`). |

```sh
docker compose up firestore backend
docker compose run --rm export
```

CONTRIBUTING.md covers running these on a build server with `scripts/remote.sh`.

## Code shared with the site

`tsconfig.json` includes `../src/app/schema.ts`, `comparison.ts` and `history.ts`, and the backend imports them so validation and the group rules can't drift from the page. They must stay free of DOM dependencies. If `history.ts` gains one, `normalizePseudonym` moves to `src/core/`.

## Tests

```sh
npm test
```

Vitest runs everything except the Firestore emulator tests (8 of them), which run only when `FIRESTORE_EMULATOR_HOST` is set. To include it, start the emulator in one terminal and run the tests in another:

```sh
gcloud emulators firestore start --host-port=127.0.0.1:8081
FIRESTORE_EMULATOR_HOST=127.0.0.1:8081 npm test
```

From the repository root, `npm run test:backend` runs `npm test` here, and `npm run check:firestore` does the same with the emulator, in Docker (`docker compose run --rm backend-test`), on your build server if `REMOTE_HOST` is set.
