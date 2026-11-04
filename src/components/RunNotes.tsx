// How a run was taken, and the easy check warning: on both results pages, under the tiles (which
// label any task that didn't finish). It says what happened, never what a result means. Then the
// medications and notes the person sent with it.
import { type RunInfo } from "../app/history";
import { missedChecksText, takenOn } from "../app/runText";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.charts.runNotes;

/** `taken`: whether to show the "Taken on" line. The Results page leaves it out: its Session section has the same details. */
export function RunNotes({ run, taken = true }: { run: RunInfo; taken?: boolean }) {
  if (!taken && run.checks_missed === 0) return null;
  return (
    <div className="run-notes">
      {taken && <p className="hint run-taken">{t.takenOn(takenOn(run))}</p>}
      {run.checks_missed > 0 && <p className="hint run-checks"><Rich text={missedChecksText(run.checks_missed)} /></p>}
    </div>
  );
}

/** The medications and notes sent with a session, in the person's own words; nothing when there are none. */
export function SessionNotes({ medications, notes }: { medications: readonly string[] | null; notes: string | null }) {
  if (!medications?.length && !notes) return null;
  return (
    <dl className="meta session-notes">
      {medications?.length ? <><dt>{t.medications}</dt><dd>{medications.join(", ")}</dd></> : null}
      {notes ? <><dt>{t.notes}</dt><dd>{notes}</dd></> : null}
    </dl>
  );
}
