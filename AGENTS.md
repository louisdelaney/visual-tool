# Instructions for AI coding assistants

These are the maintainer's rulings for this project. They apply to any tool or person changing the code. If a request conflicts with one of them, say so instead of changing it quietly. The README covers how the project works; this file covers what must stay true.

## Not medical advice

- The site is just for fun. Make that very clear on the home page and wherever results are shown.
- Never say or suggest that the test can diagnose, screen for, detect or indicate any condition. Don't mention diagnosis as a use, even to deny it.
- No wording that judges a result: nothing like "normal", "abnormal", "typical", "healthy", "impaired", "at risk", "below/above most people", or flags for being outside a range.

## What the graphs show

The Results page shows the person's results beside two groups, and nothing else:

- **Control group**: people who contributed and said they **don't** have or suspect a visual perceptual disorder and have **never** used psychedelic drugs.
- **Used psychedelics**: people who said they **don't** have or suspect a visual perceptual disorder and **have** used psychedelic drugs.
- **The person** themselves.

Rules:

- **Never show people who reported a disorder as a group on the site.** Putting one in front of the person is too suggestive. Their data is in the public export for others to interpret as they like, but the project does no interpreting: no group, chart, statistic or claim built from them on any page, and no endpoint the page uses that returns one.
- People who answered "prefer not to say" about psychedelics are in neither group.
- **Information only.** Show the numbers (median, middle half, middle 80%) and the person's own value. Draw no conclusions from where a value falls: no verdicts, labels, colours or text that rank or classify the person.
- A group isn't shown until it has at least 5 people (`MIN_GROUP` in `src/app/comparison.ts`). The backend enforces the same minimum.
- Only groups from the same `test_version` are ever compared or pooled.
- Both pages show sensitivity bars in the clinic's "Glass Patterns" style: the person's motion, form and motion − form bars, then each group's median bars with a line across the middle half.
- The User results page is a list of the person's sessions, newest first: each with its sensitivity bars beside the groups and its two staircases. No charts across sessions.
- No example, sample or simulated results in the production site. Development-only sample data must be clearly labelled and never ship in a build.

## Privacy

What the site promises users, on the Privacy and risks page:

- All contributed data is public and anonymous, and nothing that identifies a person is logged.
- The pseudonym is optional, and it's the only key (no passwords or accounts).
- No IP addresses or request headers are stored or logged, including User-Agent, Sec-CH-UA and Accept-Language.
- The backend's own logs, kept for 7 days, hold only errors and one anonymous line per request: method, route name, status, duration and a random id (also returned to the caller when a request fails). Never an IP, a header, a path or query string, a request body or a pseudonym. Cloud Run's own request logs stay excluded.
- No cookies, analytics or third-party requests. Fonts are bundled, every fetch omits credentials and referrer, and the build adds a strict Content Security Policy.

Don't add anything that breaks these promises. If a change touches what's collected or sent, update the Privacy and risks page to match.

## One fixed test

- Everyone takes the same test, with no configurable timings, sizes or modes, so results are consistent across computers.
- Any change to stimuli, timing or the staircase is a new test: bump `TEST_VERSION` in `src/core/protocol.ts`.
- A change to the exported JSON shape bumps `schema_version` in `src/app/schema.ts`.
- Changes to `src/core/` or `src/stage/` need the end-to-end tests run (`npm run test:e2e`).
