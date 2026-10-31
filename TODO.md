# To do

Agreed work that isn't done yet.

Try impecabble style

## Contributions through pull requests

Let other people contribute, with every change approved by the maintainer before it lands.

- Protect `main`: changes only through pull requests, at least one approving review from the maintainer, and CI (`.github/workflows/ci.yml`) passing first.
- Add a `CODEOWNERS` file naming the maintainer, so their review is required.
- Require approval before workflows run on pull requests from first-time contributors.
- Add a `CONTRIBUTING.md` and a pull request template. Say that changes to `src/core/` or `src/stage/` need the end-to-end tests run, and may need `TEST_VERSION` bumped.

## Preventing abuse of the backend

The endpoints are public and unauthenticated, so they need limits without logging IP addresses (see the privacy rules in the README).

- Cap request rates and body sizes. The ~200 KB limit and Cloud Run's maximum of 2 instances are already planned.
- Reject sessions that can't be real: wrong schema, impossible timings, too few trials.
- Decide how to stop junk or fake submissions polluting the comparison groups without tracking people.
- Keep the $5 budget alert, and decide what happens when it fires.

## One person running the test several times

Stop someone from doing several runs in a row and submitting them as different people.

- When a run starts straight after another in the same browser, ask whether it's the same person before carrying on.
- Decide what to record: for example, a `same_person_as_previous` answer in the session, or reusing the earlier pseudonym. A new field means bumping `schema_version`.
- Decide whether to keep a marker in the browser's local storage. It's on the person's own device and nothing is sent, but the Privacy and risks page would need to mention it.
