// Step 1: whether to contribute results to the public dataset, and if so a few questions. Nothing
// is sent here: the answers are kept and sent with the results when the tasks finish.
import { useState, type FormEvent } from "react";
import { freshPseudonym } from "../app/api";
import { normalizePseudonym } from "../app/history";
import type { Condition, ContributionAnswers, ContributionChoice, FoundVia, PsychedelicUse, YesNo } from "../app/types";
import { getState, setState } from "../app/store";
import { show, showHistory } from "../app/flow";
import { FunNotice } from "../components/FunNotice";
import { ChipInput, NO_CHIPS, chipValues, type Chips } from "../components/ChipInput";

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
  psychedelicsUsed: Chips;
  takesMedication: YesNo | "";
  medications: Chips;
  notes: string;
  foundVia: FoundVia | "";
  foundViaOther: string;
}

const EMPTY: Draft = { contribute: "", pseudonym: "", disorder: "", condition: "", otherCondition: "", diagnosed: "", psychedelics: "", uses: "", psychedelicsUsed: NO_CHIPS, takesMedication: "", medications: NO_CHIPS, notes: "", foundVia: "", foundViaOther: "" };

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
    psychedelicsUsed: { items: a.psychedelics_used ?? [], typing: "" },
    takesMedication: a.takes_medication ?? "",
    medications: { items: a.medications ?? [], typing: "" },
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
    psychedelics_used: d.psychedelics === "yes" ? chipValues(d.psychedelicsUsed) : null,
    takes_medication: d.takesMedication || null,
    medications: d.takesMedication === "yes" ? chipValues(d.medications) : null,
    notes: d.notes.trim() || null,
    found_via: d.foundVia || null,
    found_via_other: d.foundVia === "other" ? d.foundViaOther.trim() || null : null,
  };
}

/** A required question left unanswered: which one, what to say beside it, and the field to focus. */
interface Missing {
  field: "contribute" | "disorder" | "condition" | "diagnosed" | "uses";
  message: string;
  focus: string;
}

/** The first required answer that's missing. */
function missingAnswer(a: ContributionAnswers): Missing | null {
  if (!a.perceptual_disorder) return { field: "disorder", message: "Please choose Yes or No.", focus: "cq-disorder-yes" };
  if (a.perceptual_disorder === "yes" && !a.condition) return { field: "condition", message: "Please choose which disorder.", focus: "cq-vss" };
  if (a.perceptual_disorder === "yes" && !a.diagnosed) return { field: "diagnosed", message: "Please choose Yes or No.", focus: "cq-diagnosed-yes" };
  if (a.psychedelics === "yes" && a.psychedelic_uses == null) return { field: "uses", message: "Please enter a whole number, 1 or more.", focus: "cq-uses" };
  return null;
}

/** The message shown inside a question that still needs an answer. */
function FieldError({ missing, field }: { missing: Missing | null; field: Missing["field"] }) {
  return missing?.field === field ? <p className="field-error" id={`err-${field}`}>{missing.message}</p> : null;
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

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <rect x="6" y="6" width="9" height="9" rx="1.5" />
    <path d="M12 6V4.5A1.5 1.5 0 0 0 10.5 3h-6A1.5 1.5 0 0 0 3 4.5v6A1.5 1.5 0 0 0 4.5 12H6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9.5l3.2 3L14 5.5" />
  </svg>
);

/** A picked radio can't be unpicked, so an optional question needs a way back to unanswered. */
function ClearAnswer({ onClear, focusId }: { onClear: () => void; focusId: string }) {
  return <p className="hint"><button type="button" className="linkish" onClick={() => { onClear(); document.getElementById(focusId)?.focus(); }}>Clear answer</button></p>;
}

export function ContributePage() {
  const [d, setDraft] = useState<Draft>(() => fromChoice(getState().contribution));
  const [status, setStatus] = useState("");
  const [missing, setMissing] = useState<Missing | null>(null);
  /** Props that mark a question as needing an answer, after Continue. */
  const flag = (field: Missing["field"]) => (missing?.field === field ? { className: "invalid", "aria-describedby": `err-${field}` } : {});
  const [generating, setGenerating] = useState(false);
  const generate = async (): Promise<void> => {
    setGenerating(true);
    const p = await freshPseudonym();
    setGenerating(false);
    set("pseudonym", p);
  };
  /** After Copy: "copied", or "select" when the browser won't allow it and the text is selected instead. */
  const [copied, setCopied] = useState<"" | "copied" | "select">("");
  const copyPseudonym = (): void => {
    const fallback = (): void => {
      setCopied("select");
      const input = document.getElementById("cq-pseudonym") as HTMLInputElement | null;
      input?.focus(); input?.select();
    };
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(d.pseudonym.trim()).then(() => setCopied("copied"), fallback);
      else fallback();
    } catch { fallback(); }
  };
  const set = <K extends keyof Draft>(key: K, value: Draft[K]): void => {
    setDraft(prev => ({ ...prev, [key]: value }));
    if (key === "pseudonym") setCopied("");
    setStatus("");
    // Answering the flagged question clears its highlight.
    if (key === missing?.field) setMissing(null);
  };
  const flagMissing = (m: Missing): void => {
    setMissing(m);
    setStatus("Please answer the highlighted question above.");
    document.getElementById(m.focus)?.focus();
  };

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (!d.contribute) { flagMissing({ field: "contribute", message: "Please choose whether to contribute.", focus: "cq-contribute-yes" }); return; }
    if (d.contribute === "no") { setState({ contribution: { contribute: false } }); show("setup"); return; }
    const answers = toAnswers(d);
    const m = missingAnswer(answers);
    if (m) { flagMissing(m); return; }
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
        <fieldset {...flag("contribute")}>
          <legend>Contribute anonymous data?</legend>
          <Radio name="contribute" value="yes" id="cq-contribute-yes" checked={d.contribute === "yes"} onPick={v => set("contribute", v)}>Yes, add my results and answers to the public dataset</Radio>
          <Radio name="contribute" value="no" checked={d.contribute === "no"} onPick={v => set("contribute", v)}>No, send nothing</Radio>
          <FieldError missing={missing} field="contribute" />
        </fieldset>

        {d.contribute === "yes" && (
          <div id="contrib-questions">
            <div className="q-section">
              <fieldset>
                <legend><label htmlFor="cq-pseudonym">Pseudonym (optional)</label></legend>
                <div className="inline">
                  <span className="with-action">
                    <input type="text" id="cq-pseudonym" maxLength={40} autoComplete="off" spellCheck={false} value={d.pseudonym} onChange={e => set("pseudonym", e.target.value)} />
                    <button type="button" className="icon-btn" id="cq-copy" disabled={!d.pseudonym.trim()} onClick={copyPseudonym} aria-label={copied === "copied" ? "Copied" : "Copy pseudonym"} title={copied === "copied" ? "Copied" : "Copy"}>
                      {copied === "copied" ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </span>
                  <button type="button" className="btn secondary" id="cq-generate" disabled={generating} onClick={() => void generate()}>{generating ? "Generating…" : "Generate one"}</button>
                </div>
                <p className="hint" role="status" aria-live="polite">{copied === "copied" ? "Copied your pseudonym." : copied === "select" ? "Copying isn't allowed here. It's selected: press Ctrl+C, or ⌘C on a Mac." : ""}</p>
                <p className="hint">Completely optional. Leave it blank and your results can't be looked up or linked together, which is the most private choice. If you use one, use the same one each time to see your results over time. It's public: anyone who enters it can see every result and answer sent with it, so don't use your name, a username you use elsewhere, or anything else that points to you. A generated one is safest; copy it somewhere or write it down.</p>
              </fieldset>
            </div>

            <section className="q-section" aria-labelledby="cq-about-h">
              <h3 id="cq-about-h">About you</h3>
              <fieldset {...flag("disorder")}>
                <legend>Do you have, or suspect you have, a visual perceptual disorder?</legend>
                <Radio name="disorder" value="yes" id="cq-disorder-yes" checked={d.disorder === "yes"} onPick={v => set("disorder", v)}>Yes</Radio>
                <Radio name="disorder" value="no" checked={d.disorder === "no"} onPick={v => set("disorder", v)}>No</Radio>
                <FieldError missing={missing} field="disorder" />
              </fieldset>
              {d.disorder === "yes" && (
                <div className="follow-up" id="cq-disorder-more">
                  <fieldset {...flag("condition")}>
                    <legend>Which one?</legend>
                    {CONDITIONS.map(([value, label]) => (
                      <Radio key={value} name="condition" value={value} id={`cq-${value}`} checked={d.condition === value} onPick={v => set("condition", v)}>{label}</Radio>
                    ))}
                    {d.condition === "other" && (
                      <input type="text" id="cq-other-text" maxLength={100} aria-label="Other disorder (optional, public)" placeholder="Which disorder? (optional)" value={d.otherCondition} onChange={e => set("otherCondition", e.target.value)} />
                    )}
                    <FieldError missing={missing} field="condition" />
                  </fieldset>
                  <fieldset {...flag("diagnosed")}>
                    <legend>Have you been diagnosed by a doctor?</legend>
                    <Radio name="diagnosed" value="yes" id="cq-diagnosed-yes" checked={d.diagnosed === "yes"} onPick={v => set("diagnosed", v)}>Yes</Radio>
                    <Radio name="diagnosed" value="no" checked={d.diagnosed === "no"} onPick={v => set("diagnosed", v)}>No</Radio>
                    <FieldError missing={missing} field="diagnosed" />
                  </fieldset>
                </div>
              )}

              <fieldset>
                <legend>Have you ever used psychedelic drugs? (optional)</legend>
                <Radio name="psychedelics" value="yes" id="cq-psychedelics-yes" checked={d.psychedelics === "yes"} onPick={v => set("psychedelics", v)}>Yes</Radio>
                <Radio name="psychedelics" value="no" checked={d.psychedelics === "no"} onPick={v => set("psychedelics", v)}>No</Radio>
                <Radio name="psychedelics" value="prefer-not-to-say" checked={d.psychedelics === "prefer-not-to-say"} onPick={v => set("psychedelics", v)}>Prefer not to say</Radio>
                {d.psychedelics && <ClearAnswer onClear={() => set("psychedelics", "")} focusId="cq-psychedelics-yes" />}
              </fieldset>
              {d.psychedelics === "yes" && (
                <div className="follow-up" id="cq-psychedelics-more">
                  <fieldset {...flag("uses")}>
                    <legend><label htmlFor="cq-uses">Estimate how many times</label></legend>
                    <input type="number" id="cq-uses" min={1} step={1} inputMode="numeric" value={d.uses} onChange={e => set("uses", e.target.value)} />
                    <FieldError missing={missing} field="uses" />
                  </fieldset>
                  <fieldset>
                    <legend><label htmlFor="cq-psychedelics-used">Which ones have you used? (optional)</label></legend>
                    <ChipInput id="cq-psychedelics-used" noun="psychedelic" value={d.psychedelicsUsed} onChange={c => set("psychedelicsUsed", c)} />
                    <p className="hint">Add one at a time. Public, like all your answers: no names of people or places.</p>
                  </fieldset>
                </div>
              )}

              <fieldset>
                <legend>Do you take any medications? (optional)</legend>
                <Radio name="medication" value="yes" id="cq-medication-yes" checked={d.takesMedication === "yes"} onPick={v => set("takesMedication", v)}>Yes</Radio>
                <Radio name="medication" value="no" checked={d.takesMedication === "no"} onPick={v => set("takesMedication", v)}>No</Radio>
                {d.takesMedication && <ClearAnswer onClear={() => set("takesMedication", "")} focusId="cq-medication-yes" />}
              </fieldset>
              {d.takesMedication === "yes" && (
                <div className="follow-up" id="cq-medication-more">
                  <fieldset>
                    <legend><label htmlFor="cq-meds">Which ones? (optional)</label></legend>
                    <ChipInput id="cq-meds" noun="medication" value={d.medications} onChange={c => set("medications", c)} />
                    <p className="hint">Add the names one at a time. Public, like all your answers: no names of people or places.</p>
                  </fieldset>
                </div>
              )}
            </section>

            <section className="q-section" aria-labelledby="cq-extras-h">
              <h3 id="cq-extras-h">Optional extras</h3>
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
            </section>
          </div>
        )}

        <div className="actions">
          <button type="submit" className="btn" id="contrib-go">Continue</button>
        </div>
        <p className="status" id="contrib-status" role="status" aria-live="polite">{status}</p>
      </form>
    </section>
  );
}
