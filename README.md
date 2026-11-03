# Form–Motion Coherence Test

A browser test of global motion and global form perception. It finds how much organised signal a person needs to see coherent motion (random-dot kinematograms) and coherent form (Glass patterns), and reports each as a sensitivity (1 ÷ threshold %), plus the motion − form difference.

It's modelled on the "Glass Patterns" test used in a UK specialist clinic for visual perceptual disorders such as HPPD and visual snow syndrome. That test's code and exact parameters aren't public, so this version is rebuilt from the closest published tasks (see [Method](#method)).

**Just for fun, not medical advice.** It can't diagnose anything. All contributed data is public and anonymous; see the Privacy and risks page.

## Running it

```sh
npm install
npm run dev        # local dev server at http://localhost:5173, reloads on save
```

Open it in a desktop browser (tested in Chrome). You need a laptop or desktop with a keyboard, a bank card to measure the screen, and about 10 minutes in a dim room (about 5 for the quick test). A large tablet works if it stands still in a stand, and the page warns tablet users about this before they start. Phones can't start the test, because their screens are too small for the tasks at an arm's length, but they can open every other page. A device with a touch screen and no mouse or trackpad is treated as a tablet if the shorter side of its screen is at least 700 CSS pixels (`src/app/device.ts`), and as a phone otherwise. The page works this out in the browser. A contributed session records only the result, `computer` or `tablet`, in `environment.device`. The page walks through:

1. **Contribute**: choose whether to send your results anonymously when you finish. If you say yes, a few questions follow: an optional pseudonym to link tests over time, any visual perceptual disorder, psychedelic use (how often and which ones), medications and notes. If you say no, nothing is sent.
2. **Set up**: examples of both tasks, what you need, and the full or quick test (see [Method](#method)).
3. **Screen size**: match an on-screen outline to an ID-1 card.
4. **Viewing distance**: a blind-spot check that turns where a moving dot vanishes into a distance, so stimuli can be drawn in degrees of visual angle.
5. **Motion task**, then **form task**: adaptive staircases that find each threshold.
6. **Results**: thresholds, sensitivities, staircase charts and the session data. If you chose to contribute, the results are sent here.

The results page shows the thresholds, sensitivities and motion − form (with a label for any task that didn't finish), a sentence comparing the two thresholds, how the run was taken (computer or tablet, viewing distance, full screen) and a note if easy check trials were missed, then the sensitivity bars and threshold charts beside the groups, and the staircases. **Session**, closed at first, has the session details. The disk button at the top right of the results opens three saves. **Save summary (PDF)** makes an A4 PDF of what the page shows, to read or print: the "just for fun, not medical advice" note, the numbers and sentence, how the run was taken, any medications and notes, the sensitivity bars and threshold charts beside the groups as they are when it's saved, the staircases, and what the numbers mean. **Save summary (JSON)** downloads a short JSON file of what the page shows (pseudonym, answers, thresholds and sensitivities, how it was taken, missed easy checks, and the staircase points). **Save full data (JSON)** downloads the whole session, exactly as it's sent to the backend. All three are made in the browser: nothing is sent to save them. The PDF code (pdf-lib, in `src/app/pdf.ts`) loads only when someone saves one, and draws with the site's own bundled font, unpacked from WOFF to TrueType in the browser (`src/app/woff.ts`).

### Sending results and the group comparison

Results are only sent if the person chooses to contribute. They're POSTed as the session JSON, with the answers under `contribution`, when the tasks finish; the Results page offers a retry if sending fails.

The Results page then shows the person's thresholds beside two groups, as people described themselves when they contributed:

- **Control group**: answered **No** to having or suspecting a visual perceptual disorder, and **No** to having used psychedelic drugs.
- **Used psychedelics**: answered **No** to the disorder question, and **Yes** to having used psychedelic drugs.

It starts with sensitivity bars in the style of the clinic's "Glass Patterns" chart: the person's motion, form and motion − form sensitivity, then each group's medians with a line across the middle half. Below the bars, for each measure it shows each group's 10th–90th and 25th–75th percentile ranges and median, with the person's own value marked. It's information only: the page draws no conclusions from where someone's results fall. It appears for everyone, contributors or not: fetching the summary sends nothing about them. The Results by pseudonym page lists each of a person's sessions, newest first, with the same numbers, sentence, run notes and "Compared with other groups" section as the Results page, and that session's two staircases. The groups are fetched fresh on each visit, so a past session is always shown beside the groups as they are now. It works the numbers out from the stored row: sensitivity is 1 ÷ threshold, and scored trials are the staircase's points. A disk button on each session saves it as a PDF summary, a JSON summary or in full, and one on the card above saves every session at once the same ways. To save a PDF of only some sessions, tick them: a bar pinned to the bottom of the window then saves the ticked ones, newest first, in one PDF. PDFs are made from what the page already has, so they need no extra request.

Both use one backend, set with `VITE_API_URL` at build time (see `.env.example`). While it's unset, the Contribute step still runs but nothing is sent and no comparison is shown, except in `npm run dev`, which shows labelled sample data.

### Backend API

Six endpoints under `VITE_API_URL`. The page calls the first five from the browser, so the backend must allow CORS from the site's origin.

`POST /sessions`: body is one session in the current schema (`schema_version` 2, the `SessionExportV2` type in `src/app/schema.ts`). Version 1, sent by a page opened before the quick test, is still accepted: it has no `test_type` and is always the full test, and its length is checked from `finished_at`. Version 2 must have `environment.device` set to `computer` or `tablet`, and a plausible `duration_s`. Store it as one document. Reply 201 with `{ "submission_id": "…", "delete_token": "…" }`; anything else counts as a failure and the page offers a retry. Reject bodies over about 200 KB, a `schema` other than `"visual-tool/session"`, or a `schema_version` it doesn't know.

`DELETE /sessions`: body `{ "submission_id": "…", "delete_token": "…" }`, the pair `POST /sessions` returned. Removes the session, its summary row and its values in its group, and replies 204; a wrong id or token gets the same 404. The submission id alone can't do it, since history lookups and the public download show it: only a SHA-256 hash of the token is stored, and it isn't exported. The page holds the token in memory only, so the Results page can offer removal until the person runs the test again or closes the tab, and nowhere else. Sessions stored before removal existed have no token and can't be removed.

`GET /groups?type=T`: summary statistics for each comparison group on the current test version (`TEST_VERSION`), for the full test (`type=full`, the default) or the quick test (`type=quick`). The two are kept apart and never pooled. There is no way to ask for another version, and `POST /sessions` only accepts the current one.

```json
{
  "test_version": 2,
  "test_type": "full",
  "groups": {
    "control": {
      "n": 64,
      "measures": {
        "motion_threshold_pct": { "p10": 6.1, "p25": 7.9, "p50": 10.2, "p75": 13.4, "p90": 17.8 },
        "form_threshold_pct":   { "p10": 11.5, "p25": 14.6, "p50": 18.9, "p75": 24.0, "p90": 31.2 },
        "motion_minus_form":    { "p10": -0.012, "p25": 0.018, "p50": 0.044, "p75": 0.071, "p90": 0.102 }
      }
    },
    "psychedelics": { "n": 12, "measures": null }
  }
}
```

- Both groups are stored sessions with `contribution.answers.perceptual_disorder` = `"no"`, the current `test_version`, the asked-for `test_type` (none counts as `"full"`), and both tasks `"complete"` in `results`.
- `control` also has `psychedelics` = `"no"`; `psychedelics` has `psychedelics` = `"yes"`. Sessions leaving the question unanswered (`null`), or answering `"prefer-not-to-say"` (offered by earlier versions of the page), are in neither group.
- The measures come from `results.motion.threshold_pct`, `results.form.threshold_pct` and `results.motion_minus_form.sensitivity`.
- `n` is the number of people in the group. While it's under 5, return `"measures": null`: too few to mean much, and too few to keep individuals hidden. The page enforces the same minimum, per group.
- Return only these numbers, never individual sessions or answers.

The page validates the response and shows nothing from one that doesn't match (see `src/app/comparison.ts`).

`GET /history?pseudonym=P`: every session sent with that pseudonym, oldest first (the newest 50 when there are more), for the "Results by pseudonym" page and the questions page's "Fill in last answers" button. Each has its type of test (`"full"` or `"quick"`), its three measures, medications, notes, the points of its two staircase charts (coherence, correct and reversal for each scored trial), `run` (each task's status, easy check trials answered wrongly, device, viewing distance and whether it ran full screen) and `answers`: the other answers sent with it, which the button fills the questions in from (all but the notes). They're all public in the export already. Sessions stored before the points or `run` were kept in the summary row send them as `null`: `/history` reads only the rows. Pseudonyms are matched in stored form: trimmed, lower case, inner spaces collapsed (the page sends them that way). There's no password: the dataset is public, and the pseudonym is optional.

```json
{
  "pseudonym": "quiet-heron",
  "sessions": [
    {
      "submission_id": "3eed1f03-…",
      "started_at": "2026-10-18T19:30:00Z",
      "test_version": 2,
      "test_type": "full",
      "values": { "motion_threshold_pct": 10.2, "form_threshold_pct": 21.0, "motion_minus_form": 0.05043 },
      "medications": ["Lamotrigine"],
      "notes": null
    }
  ]
}
```

`GET /history/sessions?pseudonym=P`: the same sessions in full, as the public export has them (times to the hour, no trial times), each with its `submission_id`, for the Results by pseudonym page's save buttons. The page only asks for them when someone saves. It has its own, lower rate limit, since each response can be several MB.

```json
{ "pseudonym": "quiet-heron", "sessions": [ { "schema": "visual-tool/session", "submission_id": "3eed1f03-…", … } ] }
```

Return an empty `sessions` list for a pseudonym nobody has used; the page's "Generate one" button relies on that to avoid handing out a pseudonym that's taken.

`GET /export`: the public download of every stored session, as a crude raw dump. It's for people who want the data; the page links to it from the Data page but never fetches it. It redirects (302) to `visual-data.json.gz` on the repository's `data` release, which `.github/workflows/export.yml` rebuilds nightly. GitHub serves release files for free, so downloads can't run up a bill. Gzip-decoded, it is:

```json
{
  "exported_at": "2026-10-31T03:00:00Z",
  "schema": "visual-tool/export",
  "total_sessions": 412,
  "sessions": [ … ]
}
```

- The file is gzip-encoded on the wire (browsers and `curl --compressed` unpack it) and served as a download. It holds every session in order of arrival, exactly as `POST /sessions` stored it, plus its `submission_id` and `received_at`, from every test version and every answer, including people who reported a disorder. This is the "anyone can download" the Privacy and risks page promises.
- Times are coarse: `started_at` and `received_at` are to the hour, with `duration_s` for how long the run took. Trials have no times (see below).
- The data is up to a day old.

### Privacy rules the backend must keep

The Privacy and risks page promises these, so the backend has to keep them:

- **No IP addresses or request headers stored**, with sessions or anywhere else. That includes `X-Forwarded-For`, and the `User-Agent`, `Sec-CH-UA` and `Accept-Language` headers browsers add to every request: the page sends the browser and its major version ("Chrome 131") inside the session, and that's all that should be kept.
- **No platform request logs kept.** Cloud Run writes request logs, with the caller's IP, user agent and referrer, by default: exclude them (a Cloud Logging exclusion on `run.googleapis.com/requests` for the service, in Terraform). The app's own logs are kept for 7 days (`log_retention_days`) and hold only errors and one anonymous line per response: the method, the name of the matched route (or `unmatched`), the status, the duration and a random id that failed requests also return in the error body so a person can quote it. Never an IP, a header, a path or query string, a request body or a pseudonym.
- **Nothing beyond the session is stored**: no cookies, no analytics, no extra fields.
- **Only what's needed to read the results is collected** (AGENTS.md, "What's collected"). The page sends `started_at` to the hour and `duration_s`, no trial times, the browser and major version only, and `environment.device`. It doesn't send a language, screen resolution, operating system or the card-measuring time. Pages opened before this was tightened still send some of those, and sessions stored then have them, so `backend/src/scrub.ts` strips them before a session is stored and again as the download is written. `received_at` is stored to the hour.
- **The public download** is the stored sessions, scrubbed as above: exact times can help single someone out and aren't needed to analyse the results.

If any of this changes, update `src/pages/PrivacyPage.tsx` to match.

## How it's built

TypeScript in strict mode, React for the pages, built with Vite.

```
src/
  core/        Protocol, seeded randomness, staircase, stimuli, geometry, CSV. No DOM: unit-tested in Node.
  stage/       The full-screen stage: drawing, trials, tasks, pausing, the blind-spot check, previews.
               Plain DOM and canvas, outside React, so nothing re-renders while stimuli are on screen.
  app/         State, sessions and scoring, exports, sending results, and the flows that run the stage.
  pages/       One React component per step.
  components/  Shared React pieces: step list, header, footer, stimulus previews, staircase charts.
  styles/      CSS by area, with colour and type tokens in tokens.css.
tests/
  unit/        Vitest unit tests for src/core.
  e2e/         Playwright runs of the built site with a simulated observer.
```

The stage's markup lives in `index.html`, outside the React root. The pages hand over to it for the blind-spot check and each task, and get the result back.

### Hosting on GitHub Pages

`npm run build` writes the static site to `dist/`, with relative paths so it works under any folder. The info pages have real addresses (`/privacy/`, `/references/`, `/data/`, `/history/`): GitHub Pages can't send every address to one page, so the build writes a copy of the page into each of those folders. Old `#privacy`-style links are moved to the new address. `.github/workflows/pages.yml` builds and publishes it on every push to `main`, or when started from the Actions tab. Pages is set to build from GitHub Actions (Settings → Pages → Source). The backend URL comes from the repository variable `API_URL`.

The page contacts nothing but its own site and the backend. Fonts are bundled, the built page carries a Content Security Policy that makes the browser block any other server (added in `vite.config.ts`), and requests send no referrer or cookies. The layout test fails if the page requests anything from another origin. GitHub, as the host, still sees visitors' IP addresses in its own server logs, which the Privacy and risks page says.

### The backend

`backend/` is the service the API section describes: Node 22 and TypeScript, the four endpoints on `node:http`, a store, and a nightly job that writes the public export. It imports the session schema, group rules and pseudonym handling from `src/app/`, so it can't drift from the page. `backend/README.md` has the details; `CONTRIBUTING.md` has the contributor's view.

```
backend/
  src/validate.ts     Checks a posted session: schema, plausible timings and trial counts, capped text.
  src/summary.ts      The small row /history reads, and which comparison group a session joins.
  src/stats.ts        Percentiles from the per-group value arrays; the /groups response.
  src/store.ts        What a store does.  src/db.ts  Firestore.  src/db-memory.ts  In memory, optionally a JSON file.
  src/config.ts       Which store and export folder the environment asks for.
  src/routes.ts       The four endpoints.  src/server.ts  CORS, limits, errors, the server.
  src/jobs/export.ts  The export job: one gzipped JSON file, visual-data.json, to EXPORT_DIR.
  tests/              Vitest, on the memory store; the Firestore test runs only when FIRESTORE_EMULATOR_HOST is set.
infra/                Terraform for everything on Google Cloud (see infra/README.md).
```

Each session is stored three ways so that nothing the page asks for grows with the dataset: `/groups` reads one document of flat value arrays, `/history` reads one person's rows, and only the export job and `/history/sessions` (one person's, when they save) read the raw sessions. Rate limits are a token bucket per instance, not per caller: the backend never looks at who is asking. Per instance and minute: 10 posts and removals together, 60 history lookups, 10 full-session lookups (`/history/sessions`, which can send several MB), and 600 other GETs. A history lookup returns at most 50 sessions.

Two stores, chosen by `BACKEND`: `firestore` (the default when `GOOGLE_CLOUD_PROJECT` is set) and `memory`, which needs no Google account and keeps everything in `DATA_FILE` if one is set. Memory mode refuses to run on Cloud Run. The export job writes to the folder `EXPORT_DIR`. A server without `EXPORT_URL` (anywhere but Cloud Run) builds the same file on each `GET /export` instead, so a local copy needs no export step.

```sh
cd backend
npm install
npm test           # unit tests
npm run dev        # memory mode on :8080, persisted to backend/data/sessions.json, for the site at :5173
npm run export     # in memory mode, writes the export files to backend/data/export
```

With `VITE_API_URL=http://localhost:8080` in `.env.local`, `npm run dev` at the top level runs the whole thing locally. It has to be the dev server, not `vite preview`: a built page's Content Security Policy only allows the API origin that was set when it was built.

Hosting: Cloud Run (0–2 instances, so the bill is bounded), Firestore in Native mode, a Cloud Logging exclusion for request logs, and a $5 budget that emails and, at 100%, closes the API automatically, all in `infra/`. The API stays closed to the internet until `api_public = true` is applied. The nightly export runs in GitHub Actions (`.github/workflows/export.yml`), signed in as a read-only Firestore account, and is published as a release file, so its downloads cost nothing. GitHub turns scheduled workflows off after 60 days without a commit; re-enable it on the Actions tab if the export stops refreshing. Every resource is named from the `name_prefix` variable (`<prefix>-api`, `<prefix>-deployer` and so on), so a fork deploys its own copy into its own project; `infra/README.md` has the one-time setup, ending with `infra/set-github-vars.sh`, which copies the Terraform outputs into the repository variables that `.github/workflows/deploy-backend.yml` and `export.yml` read. That workflow builds the container from `backend/Dockerfile` on GitHub's runners and deploys it on every push to `main` that touches the backend, authenticating with Workload Identity Federation rather than a stored key, and only from this repository's `main`.

The repository root has a `compose.yaml` that runs the backend against a Firestore emulator, and `scripts/remote.sh` runs the same commands on a build server; `CONTRIBUTING.md` explains both. Neither is needed to work on the project.

## Method

There are two fixed types of test, the full test and a quick test, and no other settings, so results are comparable across people and computers. Quick and full results are never pooled or compared.

| | Motion | Form |
| --- | --- | --- |
| Stimulus | 250 dots in an 8° square. Signal dots drift up or down at 20.1°/s; noise dots are replotted every frame; every dot lives 83.3 ms | Dynamic radial Glass pattern (a starburst): 2146 dot pairs in a 10.7° disc, 12 new patterns per flash |
| Timing | 1 s fixation, then a 200 ms flash, the same for everyone | 1 s fixation, then two 200 ms flashes 0.5 s apart |
| Judgement | Up or down | Which flash held the starburst |
| Source | Pavan et al. 2013 | Roccato et al. 2024, their radial condition |

Both tasks start at 100% coherence and step down ×0.84 after each correct answer until the first error. After that, three correct in a row step down and an error steps up (3-down/1-up, about 79% correct, the rule and target Roccato et al. used). A run stops at 16 reversals, and the threshold is the geometric mean of the last 12, as in Pavan et al. That's typically 80–100 trials per task, within the 70–120 that Alcalá-Quintana & García-Pérez (2007) recommend for this kind of staircase; like them, it averages on a log scale because the steps multiply. An easy 100% trial after every eighth checks attention. Sensitivity is 1 ÷ threshold in percent, the scale the clinic reported.

The **quick test** is a separate type of test with the same stimuli, start level and steps, and a shorter run: each task stops at 8 reversals and averages the last 6 (at most 80 scored trials), and the easy check trial comes after every 16th trial instead of every 8th. It still discards the first two reversals, which sit high while the staircase settles. Against simulated observers (4,000 runs each, thresholds of 6–45%):

| | Full: 16 reversals, last 12 | Quick: 8 reversals, last 6 |
| --- | --- | --- |
| Trials per task at a 12% threshold, median (90th percentile) | 91 (110) | 48 (63) |
| Trials per task, averaged over thresholds | 90 | 48 (53%) |
| Task time, at about 1.8 s per motion trial and 2.8 s per form trial | about 7 minutes | about 3.7 minutes |
| Run-to-run spread of the threshold (one geometric SD) | ×1.18–1.19 | ×1.26–1.40 |
| Bias against the 79% point | −1% to −4% | −3% to +6% |

Calibration and practice are the same for both, so the whole visit drops from about 10 minutes to about 7. The quick run is shorter than any published recommendation for this kind of staircase, which is why its results are labelled and kept apart. Shorter quick runs (6 or 7 reversals) were tried and were less precise, and a faster first descent saved trials only by pulling thresholds low.

Screen size and viewing distance follow the virtual chinrest of Li et al. (2020), with the distance solved for off-axis viewing.

The page's **Method and sources** table lists every parameter and where it comes from.

## Data

Sessions can be saved as JSON, with every trial, the calibration and the full protocol parameters. During the test the session is held in memory only; it's exported, and sent if the person chose to contribute, when the tasks finish.

Each JSON file carries two version numbers and, from schema version 2, the type of test:

- **`test_version`**: the version of the test itself. Any change to what participants see or do (timings, sizes, dot counts, the staircase, instructions that could change answers) is a different test and gets the next number. Never pool results across test versions. It's `TEST_VERSION` in `src/core/protocol.ts`; a unit test pins the parameters to it, so changing one without bumping it fails.
- **`test_type`**: `"full"` or `"quick"`. The quick test is a separate, less precise test; never pool or compare it with the full test. Schema version 1 files have none and are all the full test. `settings.run` says the same (`"published"` or `"quick"`), and `protocol.parameters` holds that test's own run length and check-trial spacing.
- **`schema_version`**: the version of the JSON format, with `schema` set to `"visual-tool/session"`. It changes only when fields are added, removed, renamed or change meaning, so readers know how to parse a file. The format is the `SessionExportV2` type in `src/app/schema.ts`, and a unit test pins its fields. Version 2 added `test_type`, and keeps only what's needed to read the results: `started_at` to the hour and `duration_s` in place of `finished_at`, no trial `at`, the browser and major version only, `environment.device`, and no language, screen size, card-measuring time or `sent_at`. Version 1 files sent from now on, and those already stored, are trimmed to match before they're stored or exported, except that they have no `device`.

Files from before versioning have no `schema_version`: treat them as schema 0. Their `version` field (`"0.1.0"` or `"0.2.0"`) was the app version, and they may have used test settings that no longer exist, so keep them apart from versioned data.

Keep exported sessions in `data/`, which git ignores, so people's results don't end up in commits.

## Tests

```sh
npm run typecheck                 # TypeScript, strict
npm test                          # unit tests: staircase, stimuli, distance geometry
npx playwright install chromium   # once, for the end-to-end tests
npm run test:e2e                  # builds, then headless Chromium: layout, blind-spot scenarios, full simulated runs (about 10 min)
```

The end-to-end tests serve `dist/` locally, drive the real page with a simulated observer, and save screenshots to `tests/output/`. They check flash timing (200 ms flashes must run 195–240 ms), so run them on an otherwise idle machine. `.github/workflows/ci.yml` runs the type check, unit tests and build on every push.

## References

- Alcalá-Quintana R, García-Pérez MA (2007). A comparison of fixed-step-size and Bayesian staircases for sensory threshold estimation. *Spatial Vision* 20:197–218. https://doi.org/10.1163/156856807780421174
- Li Q, Joo SJ, Yeatman JD, Reinecke K (2020). Controlling for participants' viewing distance in large-scale, psychophysical online experiments using a virtual chinrest. *Scientific Reports*. https://doi.org/10.1038/s41598-019-57204-1
- Pavan A, Skujevskis M, Baggio G (2013). Motion words selectively modulate direction discrimination sensitivity for threshold motion. *Frontiers in Human Neuroscience* 7:134. https://doi.org/10.3389/fnhum.2013.00134
- Roccato M, Campana G, Vicovaro M, Donato R, Pavan A (2024). Perception of complex Glass patterns through spatial summation across unique frames. *Vision Research* 216:108364. https://doi.org/10.1016/j.visres.2024.108364
- Seu L, Ferrera VP (2001). Detection thresholds for spiral Glass patterns. *Vision Research* 41:3785–3790. https://pmc.ncbi.nlm.nih.gov/articles/PMC4487671
