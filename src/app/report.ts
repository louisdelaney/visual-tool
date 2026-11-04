// What a PDF summary holds: one or more sessions, each with what the results pages show for it.
// Built from the session just run (Results page) or from stored rows (Results by pseudonym page), so the
// PDF never needs anything the page hasn't already got. Made and saved in the browser: nothing is
// sent to make one.
import { TEST_VERSION, type TestType } from "../core/protocol";
import { ownValues, type GroupsResponse, type MeasureKey } from "./comparison";
import { runInfoOf, staircasePoints, type HistoryEntry, type RunInfo, type Staircases } from "./history";
import { downloadFile, exportObject } from "./export";
import type { Session } from "./types";
import { runNumbers, type RunNumbers } from "./runNumbers";
import type { Load as GroupLoad } from "../components/GroupComparison";
import { text } from "../text";

/**
 * The groups one session is shown beside. `none`: no groups on this copy of the test, or an
 * earlier test version, so only the person's own bars. `unavailable`: they hadn't loaded, or failed
 * to, when the file was saved.
 */
export type ReportGroups =
  | { state: "none" }
  | { state: "unavailable" }
  | { state: "ready"; stats: GroupsResponse; sample: boolean };

export interface ReportSession {
  /** ISO time the run started (to the hour for stored sessions). */
  started_at: string;
  test_type: TestType;
  test_version: number;
  numbers: RunNumbers;
  values: Record<MeasureKey, number | null>;
  /** Null for a stored session from before this was kept. */
  run: RunInfo | null;
  medications: string[] | null;
  notes: string | null;
  staircases: Staircases | null;
  groups: ReportGroups;
}

export interface Report {
  pseudonym: string | null;
  /** Newest first, as the pages list them. */
  sessions: ReportSession[];
  /** Development only: made-up history, labelled as such. */
  sample?: boolean;
}

/**
 * The groups as the page has them, for a session of this test type and version. Only groups from
 * the same version and type are ever shown beside a session; anything else counts as unavailable.
 */
export function reportGroups(load: GroupLoad | null | undefined, testType: TestType, testVersion: number): ReportGroups {
  if (!load || testVersion !== TEST_VERSION) return { state: "none" };
  if (load.state !== "ready" || load.stats.test_type !== testType || load.stats.test_version !== testVersion) return { state: "unavailable" };
  return { state: "ready", stats: load.stats, sample: load.sample };
}

/** The session just run, as the Results page shows it. */
export function reportSession(s: Session, groups: GroupLoad | null): ReportSession | null {
  if (!s.results) return null;
  const answers = s.contribution?.contribute ? s.contribution.answers : null;
  const motion = s.tasks.motion, form = s.tasks.form;
  return {
    started_at: s.startedAt,
    test_type: s.testType,
    test_version: s.testVersion,
    numbers: s.results,
    values: ownValues(s.results),
    run: runInfoOf(exportObject(s)),
    medications: answers?.medications ?? null,
    notes: answers?.notes ?? null,
    staircases: motion || form ? { motion: motion ? staircasePoints(motion.trials, "motion") : [], form: form ? staircasePoints(form.trials, "form") : [] } : null,
    groups: reportGroups(groups, s.testType, s.testVersion),
  };
}

/** A stored session, as the Results by pseudonym page shows it. */
export function reportEntry(e: HistoryEntry, groups: Record<TestType, GroupLoad> | null): ReportSession {
  return {
    started_at: e.started_at,
    test_type: e.test_type,
    test_version: e.test_version,
    numbers: runNumbers(e),
    values: e.values,
    run: e.run,
    medications: e.medications,
    notes: e.notes,
    staircases: e.staircases,
    groups: reportGroups(groups?.[e.test_type], e.test_type, e.test_version),
  };
}

/** Makes the PDF, loading its code and fonts only when first asked for. */
export async function summaryPDF(report: Report): Promise<Uint8Array> {
  const { buildSummaryPDF, loadFonts } = await import("./pdf");
  return buildSummaryPDF(report, await loadFonts());
}

/** Makes the PDF and hands it to the browser to save. Resolves the file's name, for the save menus. */
export async function savePDF(filename: string, report: Report): Promise<string> {
  let bytes: Uint8Array;
  try {
    bytes = await summaryPDF(report);
  } catch {
    throw new Error(text.results.pdfFailed);
  }
  downloadFile(filename, bytes, "application/pdf");
  return filename;
}
