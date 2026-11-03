// The protocol tables and reference list on "Method and references", one set of task
// parameters per test version. The quick test is described with the version it belongs to.

export interface ProtocolRow {
  parameter: string;
  value: string;
  source: string;
}

export interface ProtocolGroup {
  title: string;
  rows: ProtocolRow[];
}

// Rows that are the same in every version of the test.
const MOTION_ROWS: ProtocolRow[] = [
  { parameter: "Motion: display", value: "250 white dots, 0.03° (drawn at least 1 pixel), in an 8° × 8° square on black; red 0.4° fixation point, shown alone for 1 s first", source: "Pavan 2013" },
  { parameter: "Motion: signal and noise", value: "A share of dots drift up or down at 20.1°/s; the rest are replotted at random every frame; every dot lives 83.3 ms", source: "Pavan 2013" },
  { parameter: "Motion: timing and answer", value: "After the 1 s fixation, the dots show for 200 ms, the same for everyone; the red point stays on. Say up or down from the moment the dots appear; an early answer doesn't cut the 200 ms short", source: "Pavan 2013 (they removed the fixation point when the dots appeared)" },
];
const FORM_PATTERN: ProtocolRow = { parameter: "Form: pattern", value: "2146 dot pairs in a 10.7° circle; dots 0.04°, 0.25° apart; white on black; grey 0.3° fixation point", source: "Roccato 2024" };
const FORM_FLICKER: ProtocolRow = { parameter: "Form: flicker", value: "12 new patterns in each 200 ms flash, or one still pattern", source: "Roccato 2024" };
const COHERENCE: ProtocolRow = { parameter: "Coherence", value: "Share of dots or dot pairs carrying the signal; no lifetime correction", source: "Pavan 2013; Roccato 2024" };
const STAIRCASE: ProtocolRow = { parameter: "Staircase", value: "Start at 100%; ×0.84 after each correct answer until the first error, then ×0.84 after three in a row correct and ÷0.84 after an error, which targets 79% correct", source: "The 3-down/1-up rule and 79% target as in Roccato 2024; fixed ×0.84 steps chosen here" };
const EASY_TRIALS: ProtocolRow = { parameter: "Easy trials and practice", value: "A 100% trial after every eighth, not scored; 4 practice trials with feedback, which can be repeated", source: "Chosen here" };
const SENSITIVITY: ProtocolRow = { parameter: "Sensitivity", value: "1 ÷ threshold in percent", source: "Chosen here" };

/** One version of the test (TEST_VERSION): what it was, and its task parameters. */
export interface MethodVersion {
  version: number;
  /** When it ran, and how its results are kept. */
  about: string;
  /** What changed from the version before, if there was one. */
  changes: string[];
  /** The quick test, if this version had one: the same test with fewer trials. */
  quick?: { about: string; differences: string[] };
  tasks: ProtocolGroup;
}

const V2_FORM_ROWS: ProtocolRow[] = [
  FORM_PATTERN,
  { parameter: "Form: shape", value: "Radial: signal pairs point along the radius, out from the centre like a starburst; the other pairs point anywhere", source: "Roccato 2024 (their radial condition); also tested in Seu & Ferrera 2001" },
  FORM_FLICKER,
  { parameter: "Form: trial", value: "1 s fixation, flash, 0.5 s gap, flash; one flash holds the starburst, the other only random pairs; say which flash had the starburst", source: "Roccato 2024" },
];
const V2_BASIS: ProtocolRow = { parameter: "Basis", value: "Two published vision-research tasks: dots drifting up or down, and a flickering starburst pattern flashed twice", source: "Pavan 2013; Roccato 2024; Seu & Ferrera 2001" };

/** Newest first. */
export const METHOD_VERSIONS: MethodVersion[] = [
  {
    version: 2,
    about: "The current version, since 2 November 2026. Its results are only ever shown beside other version 2 results.",
    changes: [
      "The form task shows a radial pattern, a starburst, in place of a 45° spiral, so every form parameter comes from a published condition.",
      "The run is longer: it stops at 16 reversals instead of 10 and uses the last 12 instead of the last 8.",
      "The threshold is averaged on a log scale (a geometric mean), because the staircase steps multiply.",
    ],
    quick: {
      about: "Version 2 also has a quick test. It's the same test with fewer trials: everything you see and do is the same, including the stimuli, the timing and the staircase steps. Its results vary more from run to run, so they are labelled as quick and only ever shown beside other quick version 2 results. Every session in the public data records which test it was, in its test_type field (\"full\" or \"quick\"), so anyone using the data can keep the two apart. Sessions from before the quick test have no test_type and are all the full test.",
      differences: [
        "It stops at 8 reversals instead of 16, and takes the threshold from the last 6 instead of the last 12.",
        "It stops after at most 80 scored trials a task instead of 150.",
        "The easy check trial comes after every 16th trial instead of every 8th.",
        "That's about 48 trials a task instead of 90, so it takes about half the time.",
      ],
    },
    tasks: {
      title: "The tasks",
      rows: [
        V2_BASIS,
        ...MOTION_ROWS,
        ...V2_FORM_ROWS,
        COHERENCE,
        STAIRCASE,
        { parameter: "Stop and threshold", value: "Stop at 16 reversals; threshold is the geometric mean of the last 12, an average taken on a log scale because the steps multiply", source: "16 reversals and the last 12 as in Pavan 2013; typically within the 70–120 trials Alcalá-Quintana & García-Pérez 2007 recommend, averaged on a log scale as they do" },
        EASY_TRIALS,
        SENSITIVITY,
      ],
    },
  },
  {
    version: 1,
    about: "The first version, until 2 November 2026. Its results stay in the public data, kept apart from version 2: the two are never pooled or compared.",
    changes: [],
    tasks: {
      title: "The tasks",
      rows: [
        { parameter: "Basis", value: "Two published vision-research tasks: dots drifting up or down, and a flickering spiral flashed twice", source: "Pavan 2013; Roccato 2024; Seu & Ferrera 2001" },
        ...MOTION_ROWS,
        FORM_PATTERN,
        { parameter: "Form: shape", value: "Spiral: signal pairs at 45° to the radius, turning one way or the other at random; the other pairs point anywhere", source: "45° chosen here (not given in Roccato 2024); spiral Glass patterns from Seu & Ferrera 2001" },
        FORM_FLICKER,
        { parameter: "Form: trial", value: "1 s fixation, flash, 0.5 s gap, flash; one flash holds the spiral, the other only random pairs; say which flash had the spiral", source: "Roccato 2024" },
        COHERENCE,
        STAIRCASE,
        { parameter: "Stop and threshold", value: "Stop at 10 reversals; threshold is the plain mean of the last 8", source: "Chosen here" },
        EASY_TRIALS,
        SENSITIVITY,
      ],
    },
  },
];

/** The same in every version. */
export const CALIBRATION_TABLE: ProtocolGroup = {
  title: "Screen size and viewing distance",
  rows: [
    { parameter: "Screen size", value: "Match an ID-1 card, 85.60 mm wide", source: "Li 2020" },
    { parameter: "Viewing distance", value: "Blind spot at 13.5° from fixation, where the dot starts to vanish; mean of 5 readings. The fixation square sits 3 cm right of centre on windows at least 43 cm wide and at the right edge on narrower ones, so the dot always travels past the blind spot's centre at up to about 80 cm. Each reading is solved for off-axis viewing with the left eye assumed 3.15 cm left of centre. The dot is red and darker than its light grey background, so nothing bright falls in the blind spot", source: "Li 2020 for the method and the 13.5° entry angle; layout, off-axis solve and colours chosen here" },
    { parameter: "Window", value: "The check and the tasks switch to full screen when they start, because both assume you sit centred on what the page draws", source: "Chosen here" },
  ],
};

export interface Reference {
  /** Authors, year and title, before the journal name. */
  before: string;
  journal: string;
  /** Volume and pages, after the journal name. */
  after: string;
  href: string;
  label: string;
  /** The first test version that cites it, if not the first. */
  since?: number;
}

export const REFERENCES: Reference[] = [
  { before: "Pavan A, Skujevskis M, Baggio G (2013). Motion words selectively modulate direction discrimination sensitivity for threshold motion. ", journal: "Frontiers in Human Neuroscience", after: " 7:134. ", href: "https://doi.org/10.3389/fnhum.2013.00134", label: "doi:10.3389/fnhum.2013.00134" },
  { before: "Roccato M, Campana G, Vicovaro M, Donato R, Pavan A (2024). Perception of complex Glass patterns through spatial summation across unique frames. ", journal: "Vision Research", after: " 216:108364. ", href: "https://doi.org/10.1016/j.visres.2024.108364", label: "doi:10.1016/j.visres.2024.108364" },
  { before: "Seu L, Ferrera VP (2001). Detection thresholds for spiral Glass patterns. ", journal: "Vision Research", after: " 41:3785–3790. ", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4487671", label: "PMC4487671" },
  { before: "Alcalá-Quintana R, García-Pérez MA (2007). A comparison of fixed-step-size and Bayesian staircases for sensory threshold estimation. ", journal: "Spatial Vision", after: " 20:197–218. ", href: "https://doi.org/10.1163/156856807780421174", label: "doi:10.1163/156856807780421174", since: 2 },
  { before: "Asher JM, Romei V, Hibbard PB (2019). Spatial frequency tuning and transfer of perceptual learning for motion coherence reflects the tuning properties of global motion processing. ", journal: "Vision", after: " 3:44. ", href: "https://doi.org/10.3390/vision3030044", label: "doi:10.3390/vision3030044" },
  { before: "Donato R, Contillo A, Campana G, Roccato M, Gonçalves ÓF, Pavan A (2024). Visual perceptual learning of form–motion integration: exploring the involved mechanisms with transfer effects and the equivalent noise approach. ", journal: "Brain Sciences", after: " 14:997. ", href: "https://doi.org/10.3390/brainsci14100997", label: "doi:10.3390/brainsci14100997" },
  { before: "Li Q, Joo SJ, Yeatman JD, Reinecke K (2020). Controlling for participants' viewing distance in large-scale, psychophysical online experiments using a virtual chinrest. ", journal: "Scientific Reports", after: ". ", href: "https://doi.org/10.1038/s41598-019-57204-1", label: "doi:10.1038/s41598-019-57204-1" },
];
