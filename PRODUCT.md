# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences, all confirmed:

- **People with HPPD, visual snow or similar**, often arriving from online communities. They're curious how they compare and keen to add their data. The site never shows them a group made of people who reported a disorder (see AGENTS.md).
- **People who have used psychedelics**, with no disorder, curious whether their perception differs.
- **Generally curious people** who want to try a real vision-science task.
- **Researchers and analysts** who use the public data export to do their own analysis.

Test-takers sit at a laptop or desktop with a keyboard, in a dim room, for about 10 minutes, with a bank card to hand for screen calibration.

## Product Purpose

A browser test of global motion and global form perception. It measures how much organised signal a person needs to see coherent motion (random-dot kinematograms) and coherent form (spiral Glass patterns), and reports each as a sensitivity plus the motion − form difference. It's modelled on a test used in a UK specialist clinic, rebuilt from published tasks because the original isn't public.

Success is all three of:

- **A large public dataset**: enough contributed sessions that the comparison groups fill up and the export is useful to others.
- **A good experience**: people finish the 10 minutes, understand their numbers, and leave satisfied, whether or not they contribute.
- **Tracking over time**: people come back with a pseudonym and see their own results across runs.

## Positioning

A careful rebuild of a clinic-style test, open to anyone, with every parameter traced to a published source. Its data is public and anonymous, with no accounts. It shows a person's numbers next to self-described groups without drawing any conclusion from them.

## Operating Context

- Flow: Contribute choice and questions → Setup → Screen size (card match) → Viewing distance (blind-spot check) → Motion task → Form task → Results.
- Info pages: User results (history by pseudonym), Privacy and risks, Method and references.
- Results offer JSON and CSV downloads and copying the session data. TODO.md asks for a downloadable PDF with the graph and description.
- The tasks run fullscreen on a canvas with exact timing. Stimuli are drawn in degrees of visual angle from the calibration.

## Capabilities and Constraints

Binding rules live in AGENTS.md and override anything here. In short:

- **Just for fun, not medical advice**, clearly on the home page and wherever results appear. No wording that diagnoses, screens or judges a result.
- **Results show only** the person, the control group and the used-psychedelics group, as numbers (median, middle half, middle 80%). No verdicts, ranking colours or labels. A group needs at least 30 people. Groups are compared only within the same `test_version`.
- **Privacy**: public and anonymous data, an optional pseudonym as the only key, no IPs or headers logged, no cookies, analytics or third-party requests, bundled fonts, strict CSP.
- **One fixed test**: no configurable timings, sizes or modes. Stimulus, timing or staircase changes bump `TEST_VERSION`.
- Desktop browser with a keyboard is required. Tested in Chrome.

Terminology in use: coherence threshold, sensitivity, motion task, form task, control group, used psychedelics, User results, Privacy and risks, Method and references.

## Brand Commitments

- Name: **Form–Motion Coherence Test**.
- Voice: plain, calm and precise, like a good science explainer. Short sentences, exact numbers, careful wording, no hype. Not a lab instrument and not a consumer app.
- Fonts: Atkinson Hyperlegible Next and Atkinson Hyperlegible Mono, bundled locally (no font CDN).

## Evidence on Hand

- Published sources for the method: Li et al. 2020, Pavan et al. 2013, Roccato et al. 2024, Seu & Ferrera 2001 (README, Method and references page).
- Real group data comes only from the backend. Development-only sample data is labelled and never ships. Never fabricate group results, participant counts, testimonials or endorsements, and never imply the clinic endorses this rebuild.

## Product Principles

1. **Information, never interpretation.** Show the numbers and where the person's value sits. Leave meaning to them.
2. **Fun and honest about it.** The "just for fun" framing is upfront and never undercut by clinical styling or claims.
3. **Earn the 10 minutes.** Calibration and tasks should feel clear and calm enough that people finish, and the results should be worth having.
4. **Privacy is visible.** Every promise on the Privacy and risks page holds in the code, and the site never asks for more than it needs.
5. **Same test for everyone.** Consistency across people and computers beats flexibility.

## Accessibility & Inclusion

- Legibility-first typefaces (Atkinson Hyperlegible) are a deliberate choice.
- The tasks need sighted use, a keyboard and fullscreen. Pages outside the tasks should stay keyboard-navigable and readable.
- Some users have visual perceptual disorders. Keep the interface outside the stimuli calm, with nothing flickering or busy.
- **Dark only, for everyone.** Bright white pages are much more distressing than dark ones for people with visual perceptual disorders, so there's no light theme and the site doesn't follow the system setting.
