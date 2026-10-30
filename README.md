# Form–Motion Coherence Test

A browser test of global motion and global form perception. It finds how much organised signal a person needs to see coherent motion (random-dot kinematograms) and coherent form (Glass patterns), and reports each as a sensitivity (1 ÷ threshold %), plus the motion − form difference.

It's modelled on the "Glass Patterns" test used in a UK specialist clinic for visual perceptual disorders such as HPPD and visual snow syndrome. That test's code and exact parameters aren't public, so this version is rebuilt from the closest published tasks (see [Method](#method)).

**Research prototype, not a medical device.** It can't diagnose anything, and there are no reference values for results taken in a browser yet.

## Running it

`index.html` is the whole app: one self-contained file of HTML, CSS and plain JavaScript, with no build step and no dependencies. Open it in a desktop browser (tested in Chrome), or serve the folder from any static host.

You need a laptop or desktop with a keyboard, a bank card to measure the screen, and about 10 minutes in a dim room. The page walks through:

1. **Screen size**: match an on-screen outline to an ID-1 card.
2. **Viewing distance**: a blind-spot check that turns where a moving dot vanishes into a distance, so stimuli can be drawn in degrees of visual angle.
3. **Motion task**, then **form task**: adaptive staircases that find each threshold.
4. **Results**: thresholds, sensitivities, staircase charts and the session data.

Nothing is sent anywhere. On the results page, **Save session (JSON)** downloads the raw session data, **Save trials (CSV)** downloads the trial table, and **Copy session data** copies the JSON to the clipboard.

### Hosting on S3

The app is static, so any static host works. For S3, upload `index.html` to a bucket and serve it through S3 static website hosting or CloudFront:

```sh
aws s3 cp index.html s3://YOUR-BUCKET/index.html --content-type "text/html; charset=utf-8"
```

The only outside requests are for the Google Fonts stylesheets. If they're blocked, the page falls back to system fonts.

## Method

The default **clinic-style** version:

| | Motion | Form |
| --- | --- | --- |
| Stimulus | 250 dots in an 8° square. Signal dots drift up or down at 20.1°/s; noise dots are replotted every frame; every dot lives 83.3 ms | Dynamic spiral Glass pattern: 2146 dot pairs in a 10.7° disc, 12 new patterns per flash |
| Timing | 1 s fixation, then a 200 ms flash, the same for everyone | 1 s fixation, then two 200 ms flashes 0.5 s apart |
| Judgement | Up or down | Which flash held the spiral |
| Source | Pavan et al. 2013 | Roccato et al. 2024; 45° spiral angle chosen here |

Both tasks start at 100% coherence and step down ×0.84 after each correct answer until the first error. After that, three correct in a row step down and an error steps up (3-down/1-up, about 79% correct). A run stops at 10 reversals, and the threshold is the mean of the last 8. An easy 100% trial after every eighth checks attention. Sensitivity is 1 ÷ threshold in percent, the scale the clinic reported.

Screen size and viewing distance follow the virtual chinrest of Li et al. (2020), with the distance solved for off-axis viewing.

An **Atkinson et al. (2006)** version can be picked in Test settings. Its displays stay on until you answer, as published.

The page's **Method and sources** table lists every parameter and where it comes from.

## Data

Sessions can be saved as JSON or CSV, or copied as JSON, with every trial, the calibration and the full protocol parameters. Each session's `version` and `settings` record how it was run. Version 0.1.0 sessions may have `settings.motionDisplay: "until-answer"`: the dots stayed on until the answer, so viewing time varied between people. Don't pool them with 0.2.0 sessions.

Keep exported sessions in `data/`, which git ignores, so people's results don't end up in commits.

## Tests

```sh
npm install
npx playwright install chromium   # once, for the end-to-end tests
npm test                          # unit tests in Node: staircase, stimuli, distance geometry
npm run test:e2e                  # headless Chromium: layout, blind-spot scenarios, full simulated runs (about 10 min)
```

The unit tests load the code straight from `index.html`, so there's no second copy to keep in sync. The end-to-end tests drive the real page with a simulated observer and save screenshots to `tests/output/`.

## References

- Atkinson J, Braddick O, Rose FE, Searcy YM, Wattam-Bell J, Bellugi U (2006). Dorsal-stream motion processing deficits persist into adulthood in Williams syndrome. *Neuropsychologia* 44:828–833. https://doi.org/10.1016/j.neuropsychologia.2005.08.002
- Li Q, Joo SJ, Yeatman JD, Reinecke K (2020). Controlling for participants' viewing distance in large-scale, psychophysical online experiments using a virtual chinrest. *Scientific Reports*. https://doi.org/10.1038/s41598-019-57204-1
- Pavan A, Skujevskis M, Baggio G (2013). Motion words selectively modulate direction discrimination sensitivity for threshold motion. *Frontiers in Human Neuroscience* 7:134. https://doi.org/10.3389/fnhum.2013.00134
- Roccato M, Campana G, Vicovaro M, Donato R, Pavan A (2024). Perception of complex Glass patterns through spatial summation across unique frames. *Vision Research* 216:108364. https://doi.org/10.1016/j.visres.2024.108364
- Seu L, Ferrera VP (2001). Detection thresholds for spiral Glass patterns. *Vision Research* 41:3785–3790. https://pmc.ncbi.nlm.nih.gov/articles/PMC4487671
