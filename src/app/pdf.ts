// The PDF summary: what the results pages show for one or more sessions, drawn on A4 for reading
// or printing. Loaded only when someone saves one, and made entirely in the browser with the
// site's own bundled font: nothing is fetched from anywhere else and nothing is sent.
//
// Like the pages, it shows the numbers and draws no conclusions from them. "Just for fun, not
// medical advice" opens the first page and is in every page's footer.
import { degrees, LineCapStyle, PDFDocument, rgb, type Color, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import regularUrl from "@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff?url";
import boldUrl from "@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff?url";
import { TEST_VERSION } from "../core/protocol";
import { describeQuantiles, groupLine, GROUP_INFO, groupSensitivities, GROUPS, groupsIntro, MEASURE_INFO, MEASURES, sensitivities, sensitivityNote, shownGroups, THRESHOLD_CHARTS_NOTE, type MeasureKey, type Quantiles, type ShownGroup } from "./comparison";
import { EXPLAIN_LEAD, explanations } from "./explanations";
import { fmt } from "./format";
import { missedChecksText, takenOn, type StaircasePoint } from "./history";
import { LOG_TICKS, logPosition, rangeAxis, roundTicks, tickDecimals } from "./scales";
import { TEST_TYPE_LABEL } from "./protocol";
import { woffToSfnt } from "./woff";
import { interpretation, type TaskNumbers } from "../components/RunSummary";
import type { Report, ReportSession } from "./report";
import type { TaskName } from "./types";

export const TITLE = "Form–Motion Coherence Test";
const FUN = "This is a casual online test for curiosity only. It isn't medical advice.";
const FOOTER = `${TITLE} · Just for fun, not medical advice.`;

/** The site's font, as bundled (WOFF). */
export interface Fonts {
  regular: Uint8Array;
  bold: Uint8Array;
}

/** Fetches the bundled fonts from this site. */
export async function loadFonts(): Promise<Fonts> {
  const get = async (url: string): Promise<Uint8Array> => {
    const r = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  };
  const [regular, bold] = await Promise.all([get(regularUrl), get(boldUrl)]);
  return { regular, bold };
}

// A4 in points, with the text column inside the margins.
const PAGE_W = 595.28, PAGE_H = 841.89;
const ML = 50, MR = 50, MT = 52, MB = 58;
const CW = PAGE_W - ML - MR;

const hex = (h: string): Color => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

/** The page's colours, for white paper: the same series colours as the charts on the site. */
const C = {
  ink: hex("#1A1F1D"),
  ink2: hex("#4A524E"),
  muted: hex("#6B736F"),
  rule: hex("#D5DAD7"),
  grid: hex("#E6E9E7"),
  axis: hex("#A9B1AD"),
  surface: hex("#F4F6F5"),
  white: rgb(1, 1, 1),
  notice: hex("#FFF4DE"),
  noticeEdge: hex("#E3A63A"),
  // What the person wrote: set apart like the notice, in a calm green-grey, as it isn't a warning.
  noted: hex("#EAF2EF"),
  notedEdge: hex("#5E8C80"),
  motion: hex("#3987E5"),
  form: hex("#D95926"),
  diff: hex("#5E9E3A"),
};

const SERIES_COLOR = { motion: C.motion, form: C.form, diff: C.diff } as const;

interface Run {
  text: string;
  bold?: boolean;
  color?: Color;
}

interface TextStyle {
  size?: number;
  bold?: boolean;
  color?: Color;
  /** Left edge, from the page's left. */
  x?: number;
  width?: number;
  /** Line height as a multiple of the size. */
  leading?: number;
}

interface Piece {
  text: string;
  font: PDFFont;
  color: Color;
  x: number;
}

/** Lays out the pages top-down: `y` is how far down the current page the next thing goes. */
class Writer {
  readonly pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;

  constructor(private readonly doc: PDFDocument, readonly regular: PDFFont, readonly bold: PDFFont) {
    this.newPage();
  }

  newPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pages.push(this.page);
    this.y = MT;
  }

  /** Starts a new page unless `h` more fits on this one (or this one is still empty). */
  keep(h: number): void {
    if (this.y + h > PAGE_H - MB && this.y > MT) this.newPage();
  }

  gap(h: number): void {
    this.y += h;
  }

  font(bold?: boolean): PDFFont {
    return bold ? this.bold : this.regular;
  }

  /** Text with its baseline at (x, y), measured down from the top of the page. */
  label(text: string, x: number, y: number, size: number, o: { bold?: boolean; color?: Color; anchor?: "start" | "middle" | "end"; rotate?: number } = {}): void {
    const font = this.font(o.bold);
    const w = font.widthOfTextAtSize(text, size);
    const dx = o.anchor === "middle" ? -w / 2 : o.anchor === "end" ? -w : 0;
    this.page.drawText(text, { x: o.rotate ? x : x + dx, y: PAGE_H - y - (o.rotate ? dx : 0), size, font, color: o.color ?? C.ink, rotate: o.rotate ? degrees(o.rotate) : undefined });
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Color, thickness = 1, o: { dash?: number[]; round?: boolean } = {}): void {
    this.page.drawLine({ start: { x: x1, y: PAGE_H - y1 }, end: { x: x2, y: PAGE_H - y2 }, color, thickness, dashArray: o.dash, lineCap: o.round ? LineCapStyle.Round : undefined });
  }

  rect(x: number, y: number, w: number, h: number, o: { fill?: Color; opacity?: number; stroke?: Color; radius?: number }): void {
    const r = Math.min(o.radius ?? 0, w / 2, h / 2);
    if (!r) {
      this.page.drawRectangle({ x, y: PAGE_H - y - h, width: w, height: h, color: o.fill, opacity: o.opacity, borderColor: o.stroke, borderWidth: o.stroke ? 0.75 : 0 });
      return;
    }
    const path = `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
    this.page.drawSvgPath(path, { x: 0, y: PAGE_H, color: o.fill, opacity: o.opacity, borderColor: o.stroke, borderWidth: o.stroke ? 0.75 : undefined });
  }

  circle(cx: number, cy: number, r: number, o: { fill?: Color; stroke?: Color; width?: number }): void {
    this.page.drawCircle({ x: cx, y: PAGE_H - cy, size: r, color: o.fill, borderColor: o.stroke, borderWidth: o.stroke ? (o.width ?? 1) : undefined });
  }

  polyline(pts: [number, number][], color: Color, thickness: number): void {
    if (pts.length < 2) return;
    const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    this.page.drawSvgPath(d, { x: 0, y: PAGE_H, borderColor: color, borderWidth: thickness, borderLineCap: LineCapStyle.Round });
  }

  /** Breaks runs of text into lines no wider than `width`. */
  wrap(runs: Run[], size: number, width: number, x0: number, baseColor: Color): Piece[][] {
    const lines: Piece[][] = [[]];
    let x = 0;
    for (const run of runs) {
      const font = this.font(run.bold), color = run.color ?? baseColor;
      for (const para of run.text.split("\n").map((p, i) => ({ p, br: i > 0 }))) {
        if (para.br) { lines.push([]); x = 0; }
        for (const token of para.p.split(/(\s+)/).filter(Boolean)) {
          const space = /^\s+$/.test(token);
          if (space) {
            if (x > 0) { lines.at(-1)!.push({ text: " ", font, color, x: x0 + x }); x += font.widthOfTextAtSize(" ", size); }
            continue;
          }
          let word = token;
          // A word too long for a line on its own is broken wherever it reaches the edge.
          while (word) {
            let w = font.widthOfTextAtSize(word, size);
            if (x + w > width && x > 0) {
              const line = lines.at(-1)!;
              while (line.length && line.at(-1)!.text === " ") line.pop();
              lines.push([]); x = 0;
            }
            let fit = word;
            if (w > width) {
              let n = word.length;
              while (n > 1 && font.widthOfTextAtSize(word.slice(0, n), size) > width) n--;
              fit = word.slice(0, n);
              w = font.widthOfTextAtSize(fit, size);
            }
            lines.at(-1)!.push({ text: fit, font, color, x: x0 + x });
            x += w;
            word = word.slice(fit.length);
          }
        }
      }
    }
    return lines;
  }

  /** How tall a paragraph will be. */
  measure(runs: Run[] | string, s: TextStyle = {}): number {
    const size = s.size ?? 10;
    const lines = this.wrap(typeof runs === "string" ? [{ text: runs, bold: s.bold }] : runs, size, s.width ?? CW, 0, C.ink);
    return lines.length * size * (s.leading ?? 1.4);
  }

  /** A paragraph, wrapped, carrying over to a new page between lines if it must. */
  para(runs: Run[] | string, s: TextStyle = {}): void {
    const size = s.size ?? 10, lh = size * (s.leading ?? 1.4);
    const lines = this.wrap(typeof runs === "string" ? [{ text: runs, bold: s.bold }] : runs, size, s.width ?? CW, s.x ?? ML, s.color ?? C.ink);
    for (const line of lines) {
      this.keep(lh);
      for (const p of line) this.page.drawText(p.text, { x: p.x, y: PAGE_H - this.y - size, size, font: p.font, color: p.color });
      this.y += lh;
    }
  }

  heading(text: string, size: number): void {
    this.para(text, { size, bold: true, leading: 1.3 });
  }

  /** A shaded box with an edge on the left, round a paragraph: the notices. */
  box(runs: Run[] | string, fill: Color, edge: Color, size = 10): void {
    const pad = 10, h = this.measure(runs, { size, width: CW - 2 * pad - 4 }) + 2 * pad - size * 0.4;
    this.keep(h);
    this.rect(ML, this.y, CW, h, { fill, radius: 4 });
    this.rect(ML, this.y, 4, h, { fill: edge });
    const top = this.y;
    this.y += pad;
    this.para(runs, { size, x: ML + pad + 4, width: CW - 2 * pad - 4 });
    this.y = top + h;
  }

  hint(text: string, size = 9.5): void {
    this.para(text, { size, color: C.ink2 });
  }

  /** Every page's footer: the "just for fun" line and the page number. */
  footers(): void {
    this.pages.forEach((page, i) => {
      this.page = page;
      this.line(ML, PAGE_H - MB + 22, PAGE_W - MR, PAGE_H - MB + 22, C.rule, 0.5);
      this.label(FOOTER, ML, PAGE_H - MB + 36, 8, { color: C.muted });
      this.label(`Page ${i + 1} of ${this.pages.length}`, PAGE_W - MR, PAGE_H - MB + 36, 8, { color: C.muted, anchor: "end" });
    });
  }
}

// ---- One session --------------------------------------------------------------------------------

function tile(w: Writer, x: number, y: number, width: number, height: number, label: string, series: keyof typeof SERIES_COLOR | null, value: string, sub: string, pill: string | null): void {
  w.rect(x, y, width, height, { fill: C.surface, stroke: C.rule, radius: 5 });
  let lx = x + 10;
  if (series) { w.rect(lx, y + 10, 7, 7, { fill: SERIES_COLOR[series], radius: 1.5 }); lx += 11; }
  w.label(label, lx, y + 17, 8.5, { color: C.ink2 });
  w.label(value, x + 10, y + 40, 19, { bold: true });
  w.label(sub, x + 10, y + 54, 8, { color: C.muted });
  if (pill) {
    const pw = w.regular.widthOfTextAtSize(pill, 7.5) + 12;
    w.rect(x + 10, y + 60, pw, 13, { stroke: C.axis, radius: 6.5 });
    w.label(pill, x + 16, y + 69.5, 7.5, { color: C.ink2 });
  }
}

/** The three tiles, as on the pages. */
function tiles(w: Writer, s: ReportSession): void {
  const R = s.numbers;
  const pillOf = (t: TaskNumbers | null): string | null => (t && t.status !== "complete" ? (t.status === "incomplete" ? "Ended early" : "No threshold") : null);
  const h = [R.motion, R.form].some(t => pillOf(t)) ? 80 : 64;
  const gap = 10, tw = (CW - 2 * gap) / 3;
  w.keep(h);
  const task = (t: TaskName, i: number): void => {
    const r = R[t], name = t === "motion" ? "Motion" : "Form";
    if (!r) { tile(w, ML + i * (tw + gap), w.y, tw, h, `${name} threshold`, t, "–", "Not run", null); return; }
    tile(w, ML + i * (tw + gap), w.y, tw, h, `${name} threshold`, t, fmt.pct(r.threshold_pct),
      `sensitivity ${fmt.fixed(r.sensitivity, 3)}${r.staircase_trials != null ? ` · ${r.staircase_trials} scored trials` : ""}`, pillOf(r));
  };
  task("motion", 0);
  task("form", 1);
  const d = R.motion_minus_form;
  tile(w, ML + 2 * (tw + gap), w.y, tw, h, "Motion minus form sensitivity", null, d ? fmt.signed(d.sensitivity, 3) : "–", d ? `motion ÷ form threshold ${fmt.fixed(d.threshold_ratio, 2)}` : "Needs both thresholds", null);
  w.gap(h + 12);
}

const BAR_SERIES = [{ key: "motion", label: "Motion" }, { key: "form", label: "Form" }, { key: "diff", label: "Motion − form" }] as const;

/** The sensitivity bars: the person's three, then each group's medians with the middle half. */
function sensitivityBars(w: Writer, s: ReportSession, shown: ShownGroup[]): void {
  const own = sensitivities(s.values);
  type Bar = { value: number | null; range?: { p25: number; p75: number } };
  const clusters: { label: string; sub: string; bars: Record<"motion" | "form" | "diff", Bar> }[] = [
    { label: "This run", sub: "", bars: { motion: { value: own.motion }, form: { value: own.form }, diff: { value: own.diff } } },
    ...shown.map(g => {
      const r = groupSensitivities(g.measures);
      return { label: GROUP_INFO[g.group].name, sub: `${g.n} people`, bars: { motion: { value: r.motion.p50, range: r.motion }, form: { value: r.form.p50, range: r.form }, diff: { value: r.diff.p50, range: r.diff } } };
    }),
  ];
  const all = clusters.flatMap(c => BAR_SERIES.flatMap(({ key }) => [c.bars[key].value, c.bars[key].range?.p25, c.bars[key].range?.p75])).filter((v): v is number => v != null);
  if (!all.length) return;
  // Only the person's own bars needs less height.
  const H = shown.length ? 190 : 150, M = { l: 46, r: 8, t: 8, b: 34 }, keyH = 16;
  w.keep(H + keyH + 10);
  const top = w.y;
  const ticks = roundTicks(Math.min(0, ...all), Math.max(0.01, ...all));
  const yLo = ticks[0]!, yHi = ticks.at(-1)!;
  const iw = CW - M.l - M.r, ih = H - M.t - M.b;
  const y = (v: number): number => top + M.t + (1 - (v - yLo) / (yHi - yLo)) * ih;
  const decimals = tickDecimals(ticks, 2);
  for (const t of ticks) {
    w.line(ML + M.l, y(t), ML + CW - M.r, y(t), t === 0 ? C.axis : C.grid, 0.75);
    w.label(fmt.fixed(t, decimals), ML + M.l - 6, y(t) + 2.5, 7.5, { color: C.muted, anchor: "end" });
  }
  const axisLabel = "Sensitivity";
  w.label(axisLabel, ML + 8, top + M.t + ih / 2 + w.regular.widthOfTextAtSize(axisLabel, 8) / 2, 8, { color: C.ink2, rotate: 90 });
  const cw = iw / clusters.length, bw = Math.min(26, cw * 0.2);
  clusters.forEach((c, i) => {
    const cx = ML + M.l + cw * (i + 0.5);
    BAR_SERIES.forEach(({ key }, j) => {
      const b = c.bars[key];
      if (b.value == null) return;
      const x = cx + (j - 1) * (bw + 3) - bw / 2;
      w.rect(x, Math.min(y(b.value), y(0)), bw, Math.max(0.75, Math.abs(y(b.value) - y(0))), { fill: SERIES_COLOR[key] });
      if (b.range) {
        const wx = x + bw / 2;
        w.line(wx, y(b.range.p75), wx, y(b.range.p25), C.ink, 1);
        w.line(wx - 4, y(b.range.p75), wx + 4, y(b.range.p75), C.ink, 1);
        w.line(wx - 4, y(b.range.p25), wx + 4, y(b.range.p25), C.ink, 1);
      }
    });
    w.label(c.label, cx, top + H - M.b + 15, 8.5, { bold: true, anchor: "middle" });
    if (c.sub) w.label(c.sub, cx, top + H - M.b + 26, 7.5, { color: C.muted, anchor: "middle" });
  });
  // The key, centred under the chart.
  const items = BAR_SERIES.map(sr => ({ ...sr, w: 12 + w.regular.widthOfTextAtSize(sr.label, 8) }));
  let kx = ML + M.l + (iw - items.reduce((n, it) => n + it.w + 14, -14)) / 2;
  const ky = top + H + 6;
  for (const it of items) {
    w.rect(kx, ky, 8, 8, { fill: SERIES_COLOR[it.key], radius: 1.5 });
    w.label(it.label, kx + 12, ky + 7, 8, { color: C.ink2 });
    kx += it.w + 14;
  }
  w.y = top + H + keyH + 10;
}

/** One measure's threshold chart: a lane per group with its ranges and median, and the person's value across them. */
function measureRow(w: Writer, measure: MeasureKey, lanes: { group: ShownGroup["group"]; q: Quantiles }[], value: number | null): void {
  const info = MEASURE_INFO[measure];
  const LANE = 30, TOP = 4, AXIS_H = 14, PAD = 10;
  const H = TOP + lanes.length * LANE + AXIS_H;
  const yours = value == null ? "This run didn't reach a value for this." : `This run: ${info.format(value)}.`;
  const text = `${yours} ${lanes.map(l => `${GROUP_INFO[l.group].name}: ${describeQuantiles(info, l.q)}.`).join(" ")} ${info.reading}`;
  w.keep(18 + H + 6 + w.measure(text, { size: 8.5 }) + 14);
  w.label(info.title, ML, w.y + 10, 10, { bold: true });
  w.label(value == null ? "–" : info.format(value), ML + CW, w.y + 10, 10, { bold: true, anchor: "end" });
  w.gap(18);
  const top = w.y, color = SERIES_COLOR[info.series];
  const { to, ticks } = rangeAxis(lanes.map(l => l.q), value, info.log);
  const x = (v: number): number => ML + PAD + to(v) * (CW - 2 * PAD);
  const decimals = tickDecimals(ticks, 0);
  if (!info.log && ticks.includes(0)) w.line(x(0), top + TOP, x(0), top + TOP + lanes.length * LANE, C.axis, 0.75, { dash: [2.5, 2.5] });
  lanes.forEach(({ group, q }, i) => {
    const y = top + TOP + i * LANE + 21;
    w.label(GROUP_INFO[group].name, ML + PAD, y - 10, 8, { bold: true, color: C.ink2 });
    w.line(ML + PAD, y, ML + CW - PAD, y, C.axis, 0.75);
    w.rect(x(q.p10), y - 5, Math.max(1, x(q.p90) - x(q.p10)), 10, { fill: color, opacity: 0.2, radius: 2 });
    w.rect(x(q.p25), y - 5, Math.max(1, x(q.p75) - x(q.p25)), 10, { fill: color, opacity: 0.45, radius: 2 });
    w.line(x(q.p50), y - 7, x(q.p50), y + 7, color, 1.75);
  });
  if (value != null) {
    w.line(x(value), top + TOP + 12, x(value), top + TOP + lanes.length * LANE, C.ink, 0.75, { dash: [1.5, 2.5] });
    lanes.forEach((_, i) => w.circle(x(value), top + TOP + i * LANE + 21, 4, { fill: C.ink, stroke: C.white, width: 1.5 }));
  }
  for (const t of ticks) w.label(info.log ? `${t}%` : fmt.signed(t, decimals), x(t), top + H - 2, 7.5, { color: C.muted, anchor: "middle" });
  w.y = top + H + 6;
  w.para(text, { size: 8.5, color: C.ink2 });
  w.gap(10);
}

/** "Compared with other groups", as on the pages. */
function groupsSection(w: Writer, s: ReportSession): void {
  const g = s.groups;
  w.keep(240);
  w.heading("Compared with other groups", 13);
  w.gap(4);
  if (s.test_version !== TEST_VERSION) {
    w.hint("This used an earlier version of the test, so it isn't shown beside the groups.");
    w.gap(6);
    sensitivityBars(w, s, []);
    return;
  }
  if (g.state !== "ready") {
    if (g.state === "unavailable") { w.hint("The groups hadn't loaded when this file was saved, so they're left out. Save it again once they've loaded to include them."); w.gap(6); }
    w.hint(sensitivityNote(false));
    w.gap(6);
    sensitivityBars(w, s, []);
    return;
  }
  if (g.sample) { w.box("Sample data for development. These are not real groups.", C.notice, C.noticeEdge, 9.5); w.gap(8); }
  const shown = shownGroups(g.stats);
  w.para(groupsIntro(s.test_type), { size: 9.5 });
  w.gap(3);
  for (const key of GROUPS) {
    const l = groupLine(key, g.stats.groups[key].n);
    w.para([{ text: "•  " }, { text: l.name, bold: true }, { text: ` ${l.rest}` }], { size: 9.5, x: ML + 6, width: CW - 6 });
  }
  w.gap(3);
  w.para(sensitivityNote(shown.length > 0), { size: 9.5 });
  w.gap(8);
  sensitivityBars(w, s, shown);
  if (!shown.length) return;
  w.keep(w.measure(THRESHOLD_CHARTS_NOTE, { size: 9.5 }) + 80);
  w.para(THRESHOLD_CHARTS_NOTE, { size: 9.5 });
  w.gap(8);
  for (const m of MEASURES) measureRow(w, m, shown.map(sg => ({ group: sg.group, q: sg.measures[m] })), s.values[m]);
}

/** One task's staircase: coherence on each scored trial (log scale), reversals circled, and the threshold. */
function staircase(w: Writer, x0: number, top: number, width: number, task: TaskName, points: StaircasePoint[], threshold: number | null): void {
  const H = 150, M = { l: 24, r: 44, t: 18, b: 24 }, color = SERIES_COLOR[task];
  w.rect(x0, top + 2, 8, 8, { fill: color, radius: 1.5 });
  w.label(task === "motion" ? "Motion" : "Form", x0 + 12, top + 9.5, 10, { bold: true });
  const iw = width - M.l - M.r, ih = H - M.t - M.b, n = points.length;
  const x = (i: number): number => x0 + M.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number): number => top + M.t + (1 - logPosition(v)) * ih;
  for (const t of LOG_TICKS) {
    w.line(x0 + M.l, y(t), x0 + width - M.r, y(t), C.grid, 0.75);
    w.label(String(t), x0 + M.l - 5, y(t) + 2.5, 7, { color: C.muted, anchor: "end" });
  }
  w.line(x0 + M.l, top + H - M.b, x0 + width - M.r, top + H - M.b, C.axis, 0.75);
  const step = n > 30 ? 10 : 5;
  for (let k = step; k <= n; k += step) {
    w.line(x(k - 1), top + H - M.b, x(k - 1), top + H - M.b + 3, C.axis, 0.75);
    w.label(String(k), x(k - 1), top + H - M.b + 12, 7, { color: C.muted, anchor: "middle" });
  }
  w.label("Trial", x0 + M.l, top + H - 1, 7, { color: C.muted });
  if (!n) { w.label("No trials were completed.", x0 + M.l + iw / 2, top + M.t + ih / 2, 8, { color: C.muted, anchor: "middle" }); return; }
  if (threshold != null) {
    w.line(x0 + M.l, y(threshold), x0 + width - M.r, y(threshold), C.ink, 0.75);
    w.label("Threshold", x0 + width - M.r + 9, y(threshold) - 2, 7, { color: C.ink2 });
    w.label(fmt.pct(threshold), x0 + width - M.r + 9, y(threshold) + 8, 7.5, { bold: true });
  }
  w.polyline(points.map((p, i) => [x(i), y(p.coherence_pct)]), color, 1.25);
  points.forEach((p, i) => { if (p.reversal) w.circle(x(i), y(p.coherence_pct), 4.5, { stroke: C.ink2, width: 0.75 }); });
  points.forEach((p, i) => w.circle(x(i), y(p.coherence_pct), 2.2, p.correct ? { fill: color, stroke: C.white, width: 0.75 } : { fill: C.white, stroke: color, width: 1 }));
}

/** What the marks on a staircase chart mean. */
function staircaseKey(w: Writer): void {
  let x = ML;
  const y = w.y + 6;
  const item = (draw: () => void, text: string, markW: number): void => {
    draw();
    w.label(text, x + markW + 4, y + 3, 8, { color: C.ink2 });
    x += markW + 4 + w.regular.widthOfTextAtSize(text, 8) + 14;
  };
  item(() => w.circle(x + 3, y, 2.6, { fill: C.ink2, stroke: C.white, width: 0.75 }), "Correct", 6);
  item(() => w.circle(x + 3, y, 2.6, { fill: C.white, stroke: C.ink2, width: 1 }), "Wrong", 6);
  item(() => w.circle(x + 5, y, 4.5, { stroke: C.ink2, width: 0.75 }), "Reversal", 10);
  item(() => w.line(x, y, x + 14, y, C.ink, 0.75), "Threshold, averaged from the last reversals", 14);
  w.gap(16);
}

function staircases(w: Writer, s: ReportSession): void {
  w.keep(20 + 150 + 30);
  w.heading("Staircases", 13);
  w.hint("Coherence (%) on each scored trial, log scale.");
  w.gap(6);
  if (!s.staircases) { w.hint("No staircases were kept for this session."); return; }
  const gap = 18, half = (CW - gap) / 2, top = w.y;
  staircase(w, ML, top, half, "motion", s.staircases.motion, s.values.motion_threshold_pct);
  staircase(w, ML + half + gap, top, half, "form", s.staircases.form, s.values.form_threshold_pct);
  w.y = top + 150 + 6;
  staircaseKey(w);
}

function sessionSection(w: Writer, s: ReportSession): void {
  const quick = s.test_type === "quick";
  w.keep(160);
  const date = new Date(s.started_at);
  const heading = `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  w.heading(heading, 16);
  // How it was taken, straight under the date, as on the Results by pseudonym page.
  if (s.run) w.hint(`Taken on: ${takenOn(s.run)}`);
  // Which test it was, large: results are only ever compared within one type and version.
  w.gap(6);
  w.para(`${TEST_TYPE_LABEL[s.test_type]} · test version ${s.test_version}`, { size: 14, bold: true, leading: 1.3 });
  if (quick) w.hint("A quick test: a shorter run, so its results are less precise than a full test's. It's shown only beside other quick-test results.");
  w.gap(10);
  tiles(w, s);
  w.para(interpretation(s.numbers), { size: 10.5 });
  w.gap(4);
  if (s.run && s.run.checks_missed > 0) w.hint(missedChecksText(s.run.checks_missed));
  // The medications and notes the person sent, in their own words, boxed so they're easy to find again.
  const noted: Run[] = [
    ...(s.medications?.length ? [{ text: "Medications: ", bold: true }, { text: s.medications.join(", ") }] : []),
    ...(s.medications?.length && s.notes ? [{ text: "\n" }] : []),
    ...(s.notes ? [{ text: "Notes: ", bold: true }, { text: s.notes }] : []),
  ];
  if (noted.length) { w.gap(6); w.box(noted, C.noted, C.notedEdge, 10.5); }
  w.gap(14);
  groupsSection(w, s);
  w.gap(10);
  staircases(w, s);
}

// ---- The document ---------------------------------------------------------------------------------

/** Builds the PDF from a report and the bundled fonts. */
export async function buildSummaryPDF(report: Report, fonts: Fonts): Promise<Uint8Array> {
  // No producer, creator or dates in the file: nothing about when or how it was made.
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all([doc.embedFont(await woffToSfnt(fonts.regular), { subset: true }), doc.embedFont(await woffToSfnt(fonts.bold), { subset: true })]);
  const many = report.sessions.length > 1;
  doc.setTitle(`${TITLE}: ${many ? "results summaries" : "results summary"}`);
  doc.setLanguage("en-GB");

  const w = new Writer(doc, regular, bold);
  w.heading(TITLE, 22);
  w.para(report.pseudonym
    ? `Results for ${report.pseudonym}: ${report.sessions.length} ${many ? "sessions, newest first" : "session"}`
    : "Results summary", { size: 12, color: C.ink2 });
  w.gap(12);
  w.box([{ text: "Just for fun. ", bold: true }, { text: FUN }], C.notice, C.noticeEdge, 10.5);
  w.gap(10);
  if (report.sample) { w.box("Sample data for development. This isn't anyone's real history.", C.notice, C.noticeEdge, 9.5); w.gap(10); }
  w.para(EXPLAIN_LEAD, { size: 10 });
  if (many) { w.gap(4); w.para("People can get better at the test with practice. Keep in mind this could affect results if the test has been taken a lot.", { size: 10 }); }
  w.gap(10);
  w.line(ML, w.y, ML + CW, w.y, C.rule, 0.75);
  w.gap(18);

  report.sessions.forEach((s, i) => {
    if (i > 0) w.newPage();
    sessionSection(w, s);
  });

  // What the numbers mean, as the pages explain it, on a page of its own.
  const groups = report.sessions.some(s => s.groups.state === "ready" && shownGroups(s.groups.stats).length > 0);
  w.newPage();
  w.heading("What the numbers mean", 13);
  w.gap(4);
  for (const e of explanations({ groups, thresholdCharts: true })) {
    w.keep(w.measure(e.text, { size: 9.5 }) + 16);
    w.para(e.title, { size: 10, bold: true });
    w.para(e.text, { size: 9.5, color: C.ink2 });
    w.gap(6);
  }

  w.footers();
  return doc.save();
}
