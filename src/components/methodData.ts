// The protocol table and reference list under "Method and sources".

export interface ProtocolRow {
  parameter: string;
  value: string;
  source: string;
}

export interface ProtocolGroup {
  title: string;
  rows: ProtocolRow[];
}

export const PROTOCOL_TABLE: ProtocolGroup[] = [
  {
    title: "The tasks",
    rows: [
      { parameter: "Basis", value: "Two published vision-research tasks: dots drifting up or down, and a flickering spiral flashed twice", source: "Pavan 2013; Roccato 2024; Seu & Ferrera 2001" },
      { parameter: "Motion: display", value: "250 white dots, 0.03° (drawn at least 1 pixel), in an 8° × 8° square on black; red 0.4° fixation point, shown alone for 1 s first", source: "Pavan 2013" },
      { parameter: "Motion: signal and noise", value: "A share of dots drift up or down at 20.1°/s; the rest are replotted at random every frame; every dot lives 83.3 ms", source: "Pavan 2013" },
      { parameter: "Motion: timing and answer", value: "After the 1 s fixation, the dots show for 200 ms, the same for everyone; the red point stays on. Say up or down from the moment the dots appear; an early answer doesn't cut the 200 ms short", source: "Pavan 2013 (they removed the fixation point when the dots appeared)" },
      { parameter: "Form: pattern", value: "2146 dot pairs in a 10.7° circle; dots 0.04°, 0.25° apart; white on black; grey 0.3° fixation point", source: "Roccato 2024" },
      { parameter: "Form: spiral", value: "Signal pairs at 45° to the radius, turning one way or the other at random; the other pairs point anywhere", source: "45° chosen here (not given in Roccato 2024); spiral Glass patterns from Seu & Ferrera 2001" },
      { parameter: "Form: flicker", value: "12 new patterns in each 200 ms flash, or one still pattern", source: "Roccato 2024" },
      { parameter: "Form: trial", value: "1 s fixation, flash, 0.5 s gap, flash; one flash holds the spiral, the other only random pairs; say which flash had the spiral", source: "Roccato 2024" },
      { parameter: "Coherence", value: "Share of dots or dot pairs carrying the signal; no lifetime correction", source: "Pavan 2013; Roccato 2024" },
      { parameter: "Staircase", value: "Start at 100%; ×0.84 after each correct answer until the first error, then ×0.84 after three in a row correct and ÷0.84 after an error, which targets 79% correct", source: "Rule chosen here; the 79% target matches Roccato 2024" },
      { parameter: "Stop and threshold", value: "Stop at 10 reversals; threshold is the mean of the last 8", source: "Chosen here" },
      { parameter: "Easy trials and practice", value: "A 100% trial after every eighth, not scored; 4 practice trials with feedback, which can be repeated", source: "Chosen here" },
      { parameter: "Sensitivity", value: "1 ÷ threshold in percent", source: "Chosen here" },
    ],
  },
  {
    title: "Screen size and viewing distance",
    rows: [
      { parameter: "Screen size", value: "Match an ID-1 card, 85.60 mm wide", source: "Li 2020" },
      { parameter: "Viewing distance", value: "Blind spot at 13.5° from fixation, where the dot starts to vanish; mean of 5 readings. The fixation square sits 3 cm right of centre on windows at least 43 cm wide and at the right edge on narrower ones, so the dot always travels past the blind spot's centre at up to about 80 cm. Each reading is solved for off-axis viewing with the left eye assumed 3.15 cm left of centre. The dot is red and darker than its light grey background, so nothing bright falls in the blind spot", source: "Li 2020 for the method and the 13.5° entry angle; layout, off-axis solve and colours chosen here" },
      { parameter: "Window", value: "The check and the tasks switch to full screen when they start, because both assume you sit centred on what the page draws", source: "Chosen here" },
    ],
  },
];

export interface Reference {
  /** Authors, year and title, before the journal name. */
  before: string;
  journal: string;
  /** Volume and pages, after the journal name. */
  after: string;
  href: string;
  label: string;
}

export const REFERENCES: Reference[] = [
  { before: "Pavan A, Skujevskis M, Baggio G (2013). Motion words selectively modulate direction discrimination sensitivity for threshold motion. ", journal: "Frontiers in Human Neuroscience", after: " 7:134. ", href: "https://doi.org/10.3389/fnhum.2013.00134", label: "doi:10.3389/fnhum.2013.00134" },
  { before: "Roccato M, Campana G, Vicovaro M, Donato R, Pavan A (2024). Perception of complex Glass patterns through spatial summation across unique frames. ", journal: "Vision Research", after: " 216:108364. ", href: "https://doi.org/10.1016/j.visres.2024.108364", label: "doi:10.1016/j.visres.2024.108364" },
  { before: "Seu L, Ferrera VP (2001). Detection thresholds for spiral Glass patterns. ", journal: "Vision Research", after: " 41:3785–3790. ", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4487671", label: "PMC4487671" },
  { before: "Li Q, Joo SJ, Yeatman JD, Reinecke K (2020). Controlling for participants' viewing distance in large-scale, psychophysical online experiments using a virtual chinrest. ", journal: "Scientific Reports", after: ". ", href: "https://doi.org/10.1038/s41598-019-57204-1", label: "doi:10.1038/s41598-019-57204-1" },
];
