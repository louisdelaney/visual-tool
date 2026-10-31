// Step 1: whether to contribute results to the public dataset, and if so a few questions. Nothing
// is sent here: the answers are kept and sent with the results when the tasks finish.
import { useState, type FormEvent } from "react";
import { freshPseudonym } from "../app/api";
import { normalizePseudonym } from "../app/history";
import type { Condition, ContributionAnswers, ContributionChoice, FoundVia, PsychedelicUse, YesNo } from "../app/types";
import { getState, setState } from "../app/store";
import { show, showHistory } from "../app/flow";
import { FunNotice } from "../components/FunNotice";

interface Draft {
  contribute: YesNo | "";
  pseudonym: string;
  disorder: YesNo | "";
  condition: Condition | "";
  otherCondition: string;
  diagnosed: YesNo | "";
  psychedelics: PsychedelicUse | "";
  /** As typed; checked to be a whole number on Continue. */
  uses: string;
  psychedelicsUsed: string;
  takesMedication: YesNo | "";
  medications: string;
  notes: string;
  foundVia: FoundVia | "";
  foundViaOther: string;
}

const EMPTY: Draft = { contribute: "", pseudonym: "", disorder: "", condition: "", otherCondition: "", diagnosed: "", psychedelics: "", uses: "", psychedelicsUsed: "", takesMedication: "", medications: "", notes: "", foundVia: "", foundViaOther: "" };

/** The form as it was answered, for coming back to change something. */
function fromChoice(c: ContributionChoice | null): Draft {
  if (!c) return EMPTY;
  if (!c.contribute) return { ...EMPTY, contribute: "no" };
  const a = c.answers;
  return {
    contribute: "yes",
    pseudonym: a.pseudonym ?? "",
    disorder: a.perceptual_disorder ?? "",
    condition: a.condition ?? "",
    otherCondition: a.other_condition ?? "",
    diagnosed: a.diagnosed ?? "",
    psychedelics: a.psychedelics ?? "",
    uses: a.psychedelic_uses == null ? "" : String(a.psychedelic_uses),
    psychedelicsUsed: a.psychedelics_used ?? "",
    takesMedication: a.takes_medication ?? "",
    medications: a.medications ?? "",
    notes: a.notes ?? "",
    foundVia: a.found_via ?? "",
    foundViaOther: a.found_via_other ?? "",
  };
}

const FOUND_VIA: [FoundVia, string][] = [["reddit", "Reddit"], ["forum", "Forum"], ["other", "Other"]];

/** A whole number of uses, 1 or more, or null if the text isn't one. */
function parseUses(text: string): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 100000 ? n : null;
}
const CONDITIONS: [Condition, string][] = [["vss", "Visual snow syndrome (VSS)"], ["hppd", "Hallucinogen persisting perception disorder (HPPD)"], ["other", "Other"]];

// Only answers to questions that were shown are kept, so a hidden follow-up never sends a stale value.
function toAnswers(d: Draft): ContributionAnswers {
  const condition = d.disorder === "yes" ? d.condition || null : null;
  return {
    pseudonym: normalizePseudonym(d.pseudonym) || null,
    perceptual_disorder: d.disorder || null,
    condition,
    other_condition: condition === "other" ? d.otherCondition.trim() || null : null,
    diagnosed: d.disorder === "yes" ? d.diagnosed || null : null,
    psychedelics: d.psychedelics || null,
    psychedelic_uses: d.psychedelics === "yes" ? parseUses(d.uses) : null,
    psychedelics_used: d.psychedelics === "yes" ? d.psychedelicsUsed.trim() || null : null,
    takes_medication: d.takesMedication || null,
    medications: d.takesMedication === "yes" ? d.medications.trim() || null : null,
    notes: d.notes.trim() || null,
    found_via: d.foundVia || null,
    found_via_other: d.foundVia === "other" ? d.foundViaOther.trim() || null : null,
  };
}

/** The first required answer that's missing: the message, and the id of the field to focus. */
function missingAnswer(a: ContributionAnswers): [string, string] | null {
  if (!a.perceptual_disorder) return ["Please say whether you have, or suspect you have, a visual perceptual disorder.", "cq-disorder-yes"];
  if (a.perceptual_disorder === "yes" && !a.condition) return ["Please choose which disorder.", "cq-vss"];
  if (a.condition === "other" && !a.other_condition) return ["Please say which other disorder.", "cq-other-text"];
  if (a.perceptual_disorder === "yes" && !a.diagnosed) return ["Please say whether you've been diagnosed.", "cq-diagnosed-yes"];
  if (!a.psychedelics) return ["Please say whether you've used psychedelic drugs.", "cq-psychedelics-yes"];
  if (a.psychedelics === "yes" && a.psychedelic_uses == null) return ["Please estimate how many times you've used psychedelic drugs, as a whole number.", "cq-uses"];
  return null;
}

interface RadioProps<T extends string> {
  name: string;
  value: T;
  checked: boolean;
  onPick: (v: T) => void;
  id?: string;
  children: string;
}

function Radio<T extends string>({ name, value, checked, onPick, id, children }: RadioProps<T>) {
  return (
    <label className="opt">
      <input type="radio" name={name} value={value} id={id} checked={checked} onChange={() => onPick(value)} />
      <span>{children}</span>
    </label>
  );
}

export function ContributePage() {
  const [d, setDraft] = useState<Draft>(() => fromChoice(getState().contribution));
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const generate = async (): Promise<void> => {
    setGenerating(true);
    const p = await freshPseudonym();
    setGenerating(false);
    set("pseudonym", p);
  };
  const set = <K extends keyof Draft>(key: K, value: Draft[K]): void => { setDraft(prev => ({ ...prev, [key]: value })); setStatus(""); };

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (!d.contribute) {
      setStatus("Choose whether to contribute your data.");
      document.getElementById("cq-contribute-yes")?.focus();
      return;
    }
    if (d.contribute === "no") { setState({ contribution: { contribute: false } }); show("setup"); return; }
    const answers = toAnswers(d);
    const missing = missingAnswer(answers);
    if (missing) { setStatus(missing[0]); document.getElementById(missing[1])?.focus(); return; }
    setState({ contribution: { contribute: true, answers } });
    show("setup");
  };

  return (
    <section className="view panel" data-view="contribute" aria-labelledby="contribute-h">
      <FunNotice />
      <h2 id="contribute-h">Contribute your results</h2>
      <p>You can add your results to a public research dataset. If you say yes, they're sent with your answers below when you finish the test. Either way, you'll see your results at the end and can save them as a file.</p>
      <ul className="key-points">
        <li><strong>All data you enter will be public but anonymous.</strong></li>
        <li><strong>Nothing extra is logged.</strong> Only your answers, results and the test's technical details are sent, and only if you say yes. Anyone can download the data, and no name, email or IP address is kept.</li>
      </ul>
      <p>
        <button type="button" className="linkish" onClick={() => show("privacy")}>Read about privacy and the risks</button> before you decide.
        Contributed before? <button type="button" className="linkish" id="history-open" onClick={() => showHistory()}>See your previous results</button>.
      </p>
      <form id="contrib-form" noValidate onSubmit={onSubmit}>
        <fieldset>
          <legend>Contribute anonymous data?</legend>
          <Radio name="contribute" value="yes" id="cq-contribute-yes" checked={d.contribute === "yes"} onPick={v => set("contribute", v)}>Yes, add my results and answers to the public dataset</Radio>
          <Radio name="contribute" value="no" checked={d.contribute === "no"} onPick={v => set("contribute", v)}>No, send nothing</Radio>
        </fieldset>

        {d.contribute === "yes" && (
          <div id="contrib-questions">
            <fieldset>
              <legend><label htmlFor="cq-pseudonym">Pseudonym (optional)</label></legend>
              <div className="inline">
                <input type="text" id="cq-pseudonym" maxLength={40} autoComplete="off" spellCheck={false} value={d.pseudonym} onChange={e => set("pseudonym", e.target.value)} />
                <button type="button" className="btn secondary" id="cq-generate" disabled={generating} onClick={() => void generate()}>{generating ? "Generating…" : "Generate one"}</button>
              </div>
              <p className="hint">Completely optional. Leave it blank and your results can't be looked up or linked together, which is the most private choice. If you use one, use the same one each time to see your results over time. It's public: anyone who enters it can see every result and answer sent with it, so don't use your name, a username you use elsewhere, or anything else that points to you. A generated one is safest; write it down.</p>
            </fieldset>

            <fieldset>
              <legend>Do you have, or suspect you have, a visual perceptual disorder?</legend>
              <Radio name="disorder" value="yes" id="cq-disorder-yes" checked={d.disorder === "yes"} onPick={v => set("disorder", v)}>Yes</Radio>
              <Radio name="disorder" value="no" checked={d.disorder === "no"} onPick={v => set("disorder", v)}>No</Radio>
            </fieldset>
            {d.disorder === "yes" && (
              <div className="follow-up" id="cq-disorder-more">
                <fieldset>
                  <legend>Which one?</legend>
                  {CONDITIONS.map(([value, label]) => (
                    <Radio key={value} name="condition" value={value} id={`cq-${value}`} checked={d.condition === value} onPick={v => set("condition", v)}>{label}</Radio>
                  ))}
                  {d.condition === "other" && (
                    <input type="text" id="cq-other-text" maxLength={100} aria-label="Other disorder (public)" placeholder="Which disorder?" value={d.otherCondition} onChange={e => set("otherCondition", e.target.value)} />
                  )}
                </fieldset>
                <fieldset>
                  <legend>Have you been diagnosed by a doctor?</legend>
                  <Radio name="diagnosed" value="yes" id="cq-diagnosed-yes" checked={d.diagnosed === "yes"} onPick={v => set("diagnosed", v)}>Yes</Radio>
                  <Radio name="diagnosed" value="no" checked={d.diagnosed === "no"} onPick={v => set("diagnosed", v)}>No</Radio>
                </fieldset>
              </div>
            )}

            <fieldset>
              <legend>Have you ever used psychedelic drugs?</legend>
              <Radio name="psychedelics" value="yes" id="cq-psychedelics-yes" checked={d.psychedelics === "yes"} onPick={v => set("psychedelics", v)}>Yes</Radio>
              <Radio name="psychedelics" value="no" checked={d.psychedelics === "no"} onPick={v => set("psychedelics", v)}>No</Radio>
              <Radio name="psychedelics" value="prefer-not-to-say" checked={d.psychedelics === "prefer-not-to-say"} onPick={v => set("psychedelics", v)}>Prefer not to say</Radio>
            </fieldset>
            {d.psychedelics === "yes" && (
              <div className="follow-up" id="cq-psychedelics-more">
                <fieldset>
                  <legend><label htmlFor="cq-uses">Estimate how many times</label></legend>
                  <input type="number" id="cq-uses" min={1} step={1} inputMode="numeric" value={d.uses} onChange={e => set("uses", e.target.value)} />
                </fieldset>
                <fieldset>
                  <legend><label htmlFor="cq-psychedelics-used">Which ones have you used? (optional)</label></legend>
                  <input type="text" id="cq-psychedelics-used" maxLength={300} autoComplete="off" value={d.psychedelicsUsed} onChange={e => set("psychedelicsUsed", e.target.value)} />
                  <p className="hint">Public, like all your answers: no names of people or places.</p>
                </fieldset>
              </div>
            )}

            <fieldset>
              <legend>Do you take any medications? (optional)</legend>
              <Radio name="medication" value="yes" id="cq-medication-yes" checked={d.takesMedication === "yes"} onPick={v => set("takesMedication", v)}>Yes</Radio>
              <Radio name="medication" value="no" checked={d.takesMedication === "no"} onPick={v => set("takesMedication", v)}>No</Radio>
            </fieldset>
            {d.takesMedication === "yes" && (
              <div className="follow-up" id="cq-medication-more">
                <fieldset>
                  <legend><label htmlFor="cq-meds">Which ones? (optional)</label></legend>
                  <input type="text" id="cq-meds" maxLength={300} autoComplete="off" value={d.medications} onChange={e => set("medications", e.target.value)} />
                  <p className="hint">Public, like all your answers: no names of people or places.</p>
                </fieldset>
              </div>
            )}

            <fieldset>
              <legend><label htmlFor="cq-notes">Notes (optional)</label></legend>
              <textarea className="answer" id="cq-notes" rows={4} maxLength={2000} value={d.notes} onChange={e => set("notes", e.target.value)} />
              <p className="hint">For example, a change in medication or symptoms since your last test, if you're tracking over time. Public: no names, contact details, or anything else that points to you.</p>
            </fieldset>

            <fieldset>
              <legend><label htmlFor="cq-found">Where did you find us? (optional)</label></legend>
              <select id="cq-found" value={d.foundVia} onChange={e => set("foundVia", e.target.value as FoundVia | "")}>
                <option value="">Choose…</option>
                {FOUND_VIA.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {d.foundVia === "other" && (
                <>
                  <input type="text" id="cq-found-other" maxLength={100} autoComplete="off" aria-label="Where did you find us? (public)" placeholder="Where?" value={d.foundViaOther} onChange={e => set("foundViaOther", e.target.value)} />
                  <p className="hint">Public: no names of people or private groups.</p>
                </>
              )}
            </fieldset>
          </div>
        )}

        <div className="actions" style={{ marginTop: 22 }}>
          <button type="submit" className="btn" id="contrib-go">Continue</button>
        </div>
        <p className="status" id="contrib-status" role="status" aria-live="polite">{status}</p>
      </form>
    </section>
  );
}
