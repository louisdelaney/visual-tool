# To do

Agreed work that isn't done yet.

Try impecabble style

## Contributions through pull requests

Let other people contribute, with every change approved by the maintainer before it lands.

- Protect `main`: changes only through pull requests, at least one approving review from the maintainer, and CI (`.github/workflows/ci.yml`) passing first.
- Add a `CODEOWNERS` file naming the maintainer, so their review is required.
- Require approval before workflows run on pull requests from first-time contributors.
- Add a pull request template (`CONTRIBUTING.md` exists and covers the tests and version bumps). Branch protection and `CODEOWNERS` are what actually stop a pull request from changing `.github/workflows/deploy-backend.yml`; until they're on, review every workflow change by hand.

## Preventing abuse of the backend

The endpoints are public and unauthenticated, so they need limits without logging IP addresses (see the privacy rules in the README). Done so far: the ~200 KB body cap, Cloud Run's maximum of 2 instances, a token bucket per instance (60 POSTs and 600 GETs a minute), plausibility checks on posted sessions (schema, run duration, trial counts, text lengths) and the $5 budget alert.

- Decide how to stop junk or fake submissions polluting the comparison groups without tracking people. The rate limit is global, not per person, so one determined person can still add many sessions.
- Decide what happens when the budget alert fires. Nothing is automatic: an automatic shut-off would be a free way for anyone to take the site down. The manual step is setting the service's maximum instances to 0 in `infra/run.tf`.

## One person running the test several times

Stop someone from doing several runs in a row and submitting them as different people.

- When a run starts straight after another in the same browser, ask whether it's the same person before carrying on.
- Decide what to record: for example, a `same_person_as_previous` answer in the session, or reusing the earlier pseudonym. A new field means bumping `schema_version`.
- Decide whether to keep a marker in the browser's local storage. It's on the person's own device and nothing is sent, but the Privacy and risks page would need to mention it.
