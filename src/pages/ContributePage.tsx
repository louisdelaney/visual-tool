// Step 1: whether to contribute results to the public dataset, and if so a pseudonym, then on a
// second page a few questions. Nothing is sent here: the answers are kept and sent with the
// results when the tasks finish.
import { useState, type FormEvent } from "react";
import { API_URL, fetchHistory, freshPseudonym } from "../app/api";
import { normalizePseudonym } from "../app/history";
import type { AgeRange, Condition, ContributionAnswers, ContributionChoice, FoundVia, YesNo } from "../app/types";
import { getState, setState } from "../app/store";
import { thisDevice } from "../app/device";
import { show, showHistory } from "../app/flow";
import { ChipInput, NO_CHIPS, chipValues, type Chips } from "../components/ChipInput";
import { text } from "../text";
import { Rich } from "../text/Rich";

const t = text.contribute;
const c = text.common;

interface Draft {
  contribute: YesNo | "";
  pseudonym: string;
  ageRange: AgeRange | "";
  disorder: YesNo | "";
  condition: Condition | "";
  otherCondition: string;
  diagnosed: YesNo | "";
  psychedelics: YesNo | "";
  /** As typed; checked to be a whole number on Continue. */
  uses: string;
  /** How long since they last used psychedelics, as typed in its two boxes. */
  sinceYears: string;
  sinceMonths: string;
  psychedelicsUsed: Chips;
  takesMedication: YesNo | "";
  medications: Chips;
  notes: string;
  foundVia: FoundVia | "";
  foundViaOther: string;
}

const EMPTY: Draft = { contribute: "", pseudonym: "", ageRange: "", disorder: "", condition: "", otherCondition: "", diagnosed: "", psychedelics: "", uses: "", sinceYears: "", sinceMonths: "", psychedelicsUsed: NO_CHIPS, takesMedication: "", medications: NO_CHIPS, notes: "", foundVia: "", foundViaOther: "" };

/** The form as it was answered, for coming back to change something. */
function fromChoice(c: ContributionChoice | null): Draft {
  if (!c) return EMPTY;
  if (!c.contribute) return { ...EMPTY, contribute: "no" };
  return fromAnswers(c.answers);
}

function fromAnswers(a: ContributionAnswers): Draft {
  return {
    contribute: "yes",
    pseudonym: a.pseudonym ?? "",
    ageRange: a.age_range ?? "",
    disorder: a.perceptual_disorder ?? "",
    condition: a.condition ?? "",
    otherCondition: a.other_condition ?? "",
    diagnosed: a.diagnosed ?? "",
    // "prefer-not-to-say" is no longer offered: leaving the question blank says the same.
    psychedelics: a.psychedelics === "yes" || a.psychedelics === "no" ? a.psychedelics : "",
    uses: a.psychedelic_uses == null ? "" : String(a.psychedelic_uses),
    sinceYears: a.months_since_psychedelics == null ? "" : String(Math.floor(a.months_since_psychedelics / 12)),
    sinceMonths: a.months_since_psychedelics == null ? "" : String(a.months_since_psychedelics % 12),
    psychedelicsUsed: { items: a.psychedelics_used ?? [], typing: "" },
    takesMedication: a.takes_medication ?? "",
    medications: { items: a.medications ?? [], typing: "" },
    notes: a.notes ?? "",
    foundVia: a.found_via ?? "",
    foundViaOther: a.found_via_other ?? "",
  };
}

const date = (iso: string): string => new Date(iso).toLocaleDateString(c.locale, { day: "numeric", month: "short", year: "numeric" });

const FOUND_VIA: FoundVia[] = ["reddit", "forum", "other"];

const AGE_LABELS: AgeRange[] = ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"];

/** A whole number of uses, 1 or more, or null if the text isn't one. */
function parseUses(text: string): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 100000 ? n : null;
}
/**
 * Whole months since last use from the years and months boxes, or null unless both are whole
 * numbers in range (years up to 100, months 0 to 11). One box left blank counts as 0; both blank is no answer.
 */
function parseSince(years: string, months: string): number | null {
  const y = years.trim(), m = months.trim();
  if ((!y && !m) || !/^\d*$/.test(y) || !/^\d*$/.test(m)) return null;
  const yn = Number(y || 0), mn = Number(m || 0);
  return yn <= 100 && mn <= 11 ? yn * 12 + mn : null;
}

const CONDITIONS: Condition[] = ["vss", "hppd", "other"];

// Only answers to questions that were shown are kept, so a hidden follow-up never sends a stale value.
function toAnswers(d: Draft): ContributionAnswers {
  const condition = d.disorder === "yes" ? d.condition || null : null;
  return {
    pseudonym: normalizePseudonym(d.pseudonym) || null,
    age_range: d.ageRange || null,
    perceptual_disorder: d.disorder || null,
    condition,
    other_condition: condition === "other" ? d.otherCondition.trim() || null : null,
    diagnosed: d.disorder === "yes" ? d.diagnosed || null : null,
    psychedelics: d.psychedelics || null,
    psychedelic_uses: d.psychedelics === "yes" ? parseUses(d.uses) : null,
    months_since_psychedelics: d.psychedelics === "yes" ? parseSince(d.sinceYears, d.sinceMonths) : null,
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
  field: "contribute" | "disorder" | "condition" | "diagnosed" | "uses" | "since";
  message: string;
  focus: string;
}

/** The first required answer that's missing, or an optional one typed in a form it can't be sent in. */
function missingAnswer(a: ContributionAnswers, d: Draft): Missing | null {
  if (!a.perceptual_disorder) return { field: "disorder", message: t.errors.yesOrNo, focus: "cq-disorder-yes" };
  if (a.perceptual_disorder === "yes" && !a.condition) return { field: "condition", message: t.errors.condition, focus: "cq-vss" };
  if (a.perceptual_disorder === "yes" && !a.diagnosed) return { field: "diagnosed", message: t.errors.yesOrNo, focus: "cq-diagnosed-yes" };
  if (a.psychedelics === "yes" && a.psychedelic_uses == null) return { field: "uses", message: t.errors.uses, focus: "cq-uses" };
  if (a.psychedelics === "yes" && a.months_since_psychedelics == null && (d.sinceYears.trim() || d.sinceMonths.trim())) return { field: "since", message: t.errors.since, focus: "cq-since-years" };
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
  return <p className="hint"><button type="button" className="linkish" onClick={() => { onClear(); document.getElementById(focusId)?.focus(); }}>{t.clearAnswer}</button></p>;
}

/**
 * Step 1 is two pages: whether to contribute (and a pseudonym), then the questions. App renders
 * both with this one component in the same place, so React keeps the draft between them.
 */
/** In place of the contribute form on a phone: the test can't start, but the rest of the site is open. */
function PhoneNotice() {
  return (
    <>
      <h2 id="contribute-h">{t.phone.heading}</h2>
      <p className="notice" id="device-phone"><Rich text={t.phone.notice} /></p>
      <p>
        <Rich text={t.phone.others} tags={{
          "history-link": ch => <button type="button" className="linkish" id="history-open" onClick={() => showHistory()}>{ch}</button>,
          "data-link": ch => <button type="button" className="linkish" onClick={() => show("data")}>{ch}</button>,
          "privacy-link": ch => <button type="button" className="linkish" onClick={() => show("privacy")}>{ch}</button>,
        }} />
      </p>
    </>
  );
}

/** Above the contribute form on a tablet: it has to stand still for the tasks. */
function TabletNotice() {
  return (
    <p className="notice" id="device-tablet">
      <Rich text={t.tablet} />
    </p>
  );
}

export function ContributePage({ part }: { part: "contribute" | "questions" }) {
  const [d, setDraft] = useState<Draft>(() => fromChoice(getState().contribution));
  const [status, setStatus] = useState("");
  const [missing, setMissing] = useState<Missing | null>(null);
  const device = thisDevice();
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
    if (key === missing?.field || (missing?.field === "since" && (key === "sinceYears" || key === "sinceMonths"))) setMissing(null);
  };
  const flagMissing = (m: Missing): void => {
    setMissing(m);
    setStatus(t.errors.answerHighlighted);
    document.getElementById(m.focus)?.focus();
  };

  /** After "Fill in last answers": what happened, for the line under the pseudonym. */
  const [fillStatus, setFillStatus] = useState("");
  const [filling, setFilling] = useState(false);
  /** Fills the questions in from the newest session sent with this pseudonym. Notes are per test, so they're left as they are. */
  const fillPrevious = async (pseudonym: string): Promise<void> => {
    setFilling(true);
    setFillStatus("");
    try {
      const last = (await fetchHistory(pseudonym)).sessions.filter(e => e.answers).pop();
      if (!last?.answers) { setFillStatus(t.fillNone(pseudonym)); return; }
      // How long since last use has changed since then, so it's asked again.
      const previous = fromAnswers({ ...last.answers, pseudonym, medications: last.medications, notes: null, months_since_psychedelics: null });
      setDraft(prev => ({ ...previous, contribute: "yes", pseudonym: prev.pseudonym, notes: prev.notes }));
      setMissing(null);
      setStatus("");
      setFillStatus(t.fillDone(date(last.started_at)));
    } catch {
      setFillStatus(t.fillFailed);
    } finally {
      setFilling(false);
    }
  };

  /** Keeps what's been answered so far, so Back and the info pages don't lose it. */
  const keepDraft = (): void => setState({ contribution: { contribute: true, answers: toAnswers(d) } });

  const onSubmitChoice = (e: FormEvent): void => {
    e.preventDefault();
    if (!d.contribute) { flagMissing({ field: "contribute", message: t.errors.contribute, focus: "cq-contribute-yes" }); return; }
    if (d.contribute === "no") { setState({ contribution: { contribute: false } }); show("setup"); return; }
    keepDraft();
    show("questions");
  };

  const onSubmitAnswers = (e: FormEvent): void => {
    e.preventDefault();
    const answers = toAnswers(d);
    const m = missingAnswer(answers, d);
    if (m) { flagMissing(m); return; }
    setState({ contribution: { contribute: true, answers } });
    show("setup");
  };

  const backToChoice = (): void => {
    keepDraft();
    setMissing(null);
    setStatus("");
    show("contribute");
  };

  if (part === "questions") {
    const pseudonym = normalizePseudonym(d.pseudonym);
    return (
      <section className="view panel" data-view="questions" aria-labelledby="questions-h">
        {pseudonym ? (
          <header className="as-pseudonym">
            <div className="pseudonym-row">
              <h2 id="questions-h"><span className="visually-hidden">{t.questionsFor}</span><span className="pseudonym">{pseudonym}</span></h2>
              {API_URL && (
                <button type="button" className="btn secondary small" id="cq-fill" disabled={filling} onClick={() => void fillPrevious(pseudonym)}>{filling ? t.filling : t.fillIn}</button>
              )}
            </div>
            <p className="hint">{t.sentUnderPseudonym}</p>
            {API_URL && <p className="hint" id="cq-fill-status" role="status" aria-live="polite">{fillStatus}</p>}
          </header>
        ) : (
          <h2 id="questions-h">{t.aboutYou}</h2>
        )}
        <form id="questions-form" className="contrib-form" noValidate onSubmit={onSubmitAnswers}>
          {pseudonym && <h3>{t.aboutYou}</h3>}
        <fieldset {...flag("disorder")}>
          <legend>{t.disorderQuestion}</legend>
          <Radio name="disorder" value="yes" id="cq-disorder-yes" checked={d.disorder === "yes"} onPick={v => set("disorder", v)}>{c.yes}</Radio>
          <Radio name="disorder" value="no" checked={d.disorder === "no"} onPick={v => set("disorder", v)}>{c.no}</Radio>
          <FieldError missing={missing} field="disorder" />
        </fieldset>
        {d.disorder === "yes" && (
          <div className="follow-up" id="cq-disorder-more">
            <fieldset {...flag("condition")}>
              <legend>{t.conditionQuestion}</legend>
              {CONDITIONS.map(value => (
                <Radio key={value} name="condition" value={value} id={`cq-${value}`} checked={d.condition === value} onPick={v => set("condition", v)}>{t.conditions[value]}</Radio>
              ))}
              {d.condition === "other" && (
                <input type="text" id="cq-other-text" maxLength={100} aria-label={t.otherConditionLabel} placeholder={t.otherConditionPlaceholder} value={d.otherCondition} onChange={e => set("otherCondition", e.target.value)} />
              )}
              <FieldError missing={missing} field="condition" />
            </fieldset>
            <fieldset {...flag("diagnosed")}>
              <legend>{t.diagnosedQuestion}</legend>
              <Radio name="diagnosed" value="yes" id="cq-diagnosed-yes" checked={d.diagnosed === "yes"} onPick={v => set("diagnosed", v)}>{c.yes}</Radio>
              <Radio name="diagnosed" value="no" checked={d.diagnosed === "no"} onPick={v => set("diagnosed", v)}>{c.no}</Radio>
              <FieldError missing={missing} field="diagnosed" />
            </fieldset>
          </div>
        )}

        <fieldset>
          <legend>{t.psychedelicsQuestion}</legend>
          <Radio name="psychedelics" value="yes" id="cq-psychedelics-yes" checked={d.psychedelics === "yes"} onPick={v => set("psychedelics", v)}>{c.yes}</Radio>
          <Radio name="psychedelics" value="no" checked={d.psychedelics === "no"} onPick={v => set("psychedelics", v)}>{c.no}</Radio>
          {d.psychedelics && <ClearAnswer onClear={() => set("psychedelics", "")} focusId="cq-psychedelics-yes" />}
        </fieldset>
        {d.psychedelics === "yes" && (
          <div className="follow-up" id="cq-psychedelics-more">
            <fieldset {...flag("uses")}>
              <legend><label htmlFor="cq-uses">{t.usesQuestion}</label></legend>
              <input type="number" id="cq-uses" min={1} step={1} inputMode="numeric" value={d.uses} onChange={e => set("uses", e.target.value)} />
              <FieldError missing={missing} field="uses" />
            </fieldset>
            <fieldset {...flag("since")}>
              <legend>{t.sinceQuestion}</legend>
              <div className="inline since">
                <label className="since-part"><input type="number" id="cq-since-years" min={0} max={100} step={1} inputMode="numeric" value={d.sinceYears} onChange={e => set("sinceYears", e.target.value)} /><span>{t.years}</span></label>
                <label className="since-part"><input type="number" id="cq-since-months" min={0} max={11} step={1} inputMode="numeric" value={d.sinceMonths} onChange={e => set("sinceMonths", e.target.value)} /><span>{t.months}</span></label>
              </div>
              <p className="hint"><Rich text={t.sinceHint} /></p>
              <FieldError missing={missing} field="since" />
            </fieldset>
            <fieldset>
              <legend><label htmlFor="cq-psychedelics-used">{t.psychedelicsUsedQuestion}</label></legend>
              <ChipInput id="cq-psychedelics-used" noun={t.psychedelicNoun} value={d.psychedelicsUsed} onChange={c => set("psychedelicsUsed", c)} />
              <p className="hint"><Rich text={t.psychedelicsUsedHint} /></p>
            </fieldset>
          </div>
        )}

        <fieldset>
          <legend>{t.medicationQuestion}</legend>
          <Radio name="medication" value="yes" id="cq-medication-yes" checked={d.takesMedication === "yes"} onPick={v => set("takesMedication", v)}>{c.yes}</Radio>
          <Radio name="medication" value="no" checked={d.takesMedication === "no"} onPick={v => set("takesMedication", v)}>{c.no}</Radio>
          {d.takesMedication && <ClearAnswer onClear={() => set("takesMedication", "")} focusId="cq-medication-yes" />}
        </fieldset>
        {d.takesMedication === "yes" && (
          <div className="follow-up" id="cq-medication-more">
            <fieldset>
              <legend><label htmlFor="cq-meds">{t.medicationsQuestion}</label></legend>
              <ChipInput id="cq-meds" noun={t.medicationNoun} value={d.medications} onChange={c => set("medications", c)} />
              <p className="hint"><Rich text={t.medicationsHint} /></p>
            </fieldset>
          </div>
        )}

        <fieldset>
          <legend><label htmlFor="cq-age">{t.ageQuestion}</label></legend>
          <select id="cq-age" value={d.ageRange} onChange={e => set("ageRange", e.target.value as AgeRange | "")}>
            <option value="">{c.choose}</option>
            {AGE_LABELS.map(value => <option key={value} value={value}>{t.ageRanges[value]}</option>)}
          </select>
        </fieldset>

          <section className="q-section" aria-labelledby="cq-extras-h">
            <h3 id="cq-extras-h">{t.extrasHeading}</h3>
          <fieldset>
            <legend><label htmlFor="cq-notes">{t.notesLabel}</label></legend>
            <textarea className="answer" id="cq-notes" rows={4} maxLength={2000} value={d.notes} onChange={e => set("notes", e.target.value)} />
            <p className="hint"><Rich text={t.notesHint} /></p>
          </fieldset>

          <fieldset>
            <legend><label htmlFor="cq-found">{t.foundViaQuestion}</label></legend>
            <select id="cq-found" value={d.foundVia} onChange={e => set("foundVia", e.target.value as FoundVia | "")}>
              <option value="">{c.choose}</option>
              {FOUND_VIA.map(value => <option key={value} value={value}>{t.foundVia[value]}</option>)}
            </select>
            {d.foundVia === "other" && (
              <>
                <input type="text" id="cq-found-other" maxLength={100} autoComplete="off" aria-label={t.foundViaOtherLabel} placeholder={t.foundViaOtherPlaceholder} value={d.foundViaOther} onChange={e => set("foundViaOther", e.target.value)} />
                <p className="hint"><Rich text={t.foundViaOtherHint} /></p>
              </>
            )}
          </fieldset>
          </section>

          <div className="actions">
            <button type="submit" className="btn" id="questions-go">{c.continue}</button>
            <button type="button" className="btn secondary back" id="questions-back" onClick={backToChoice}>{c.back}</button>
          </div>
          <p className="status" id="questions-status" role="status" aria-live="polite">{status}</p>
        </form>
      </section>
    );
  }

  return (
    <section className="view panel" data-view="contribute" aria-labelledby="contribute-h">
      <h2>{t.measuresHeading}</h2>
      <p><Rich text={t.measuresIntro} /></p>
      <p><Rich text={t.measuresCompare} /></p>
      <p><Rich text={t.noGoodOrBad} /></p>
      <p><Rich text={t.usualSelf} /></p>
      {device === "phone" ? <PhoneNotice /> : <>
        {device === "tablet" && <TabletNotice />}
        <h2 id="contribute-h">{t.contributeHeading}</h2>
        <p><Rich text={t.contributeIntro} /></p>
        <ul className="key-points">
          <li><Rich text={t.publicAnonymous} /></li>
          <li><Rich text={t.nothingLogged} /></li>
        </ul>
        <p>
          <Rich text={t.privacyAndHistory} tags={{
            "privacy-link": ch => <button type="button" className="linkish" onClick={() => show("privacy")}>{ch}</button>,
            "history-link": ch => <button type="button" className="linkish" id="history-open" onClick={() => showHistory()}>{ch}</button>,
          }} />
        </p>
        <form id="contrib-form" className="contrib-form" noValidate onSubmit={onSubmitChoice}>
          <fieldset {...flag("contribute")}>
            <legend>{t.contributeQuestion}</legend>
            <Radio name="contribute" value="yes" id="cq-contribute-yes" checked={d.contribute === "yes"} onPick={v => set("contribute", v)}>{t.contributeYes}</Radio>
            <Radio name="contribute" value="no" checked={d.contribute === "no"} onPick={v => set("contribute", v)}>{t.contributeNo}</Radio>
            <FieldError missing={missing} field="contribute" />
          </fieldset>

          {d.contribute === "yes" && (
            <fieldset>
              <legend><label htmlFor="cq-pseudonym">{t.pseudonymLabel}</label></legend>
              <div className="inline">
                <span className="with-action">
                  <input type="text" id="cq-pseudonym" maxLength={40} autoComplete="off" spellCheck={false} value={d.pseudonym} onChange={e => set("pseudonym", e.target.value)} />
                  <button type="button" className="icon-btn" id="cq-copy" disabled={!d.pseudonym.trim()} onClick={copyPseudonym} aria-label={copied === "copied" ? t.copied : t.copyPseudonym} title={copied === "copied" ? t.copied : t.copy}>
                    {copied === "copied" ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </span>
                <button type="button" className="btn secondary" id="cq-generate" disabled={generating} onClick={() => void generate()}>{generating ? t.generating : t.generate}</button>
              </div>
              <p className="hint" role="status" aria-live="polite">{copied === "copied" ? t.copiedStatus : copied === "select" ? t.copyBlocked : ""}</p>
              <p className="hint"><Rich text={t.pseudonymHint} /></p>
            </fieldset>
          )}

          <div className="actions">
            <button type="submit" className="btn" id="contrib-go">{c.continue}</button>
          </div>
          <p className="status" id="contrib-status" role="status" aria-live="polite">{status}</p>
        </form>
      </>}
    </section>
  );
}
