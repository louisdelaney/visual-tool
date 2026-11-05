// The papers on "Method and references", cited as published, so the same in every language.
// The protocol tables and what each version was are words: they're in src/text/en/method.ts.

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
