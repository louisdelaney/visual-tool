import { useState } from "react";
import { ChipInput, NO_CHIPS, MAX_CHIPS, type Chips } from "visual-tool";

// ChipInput is a controlled list field: the parent owns a { items, typing } value.
// Each story keeps that state locally so the + and × buttons work in the card, and
// wraps the field in the fieldset/legend/hint the contribute form actually uses.

function Field({ id, noun, legend, hint, initial }: {
  id: string; noun: string; legend: string; hint: string; initial: Chips;
}) {
  const [value, setValue] = useState<Chips>(initial);
  return (
    <div className="wrap">
      <fieldset>
        <legend><label htmlFor={id}>{legend}</label></legend>
        <ChipInput id={id} noun={noun} value={value} onChange={setValue} />
        <p className="hint">{hint}</p>
      </fieldset>
    </div>
  );
}

const HINT = "Add one at a time. Public, like all your answers: no names of people or places.";

/** Nothing added yet — just the input and a disabled add button. */
export const Empty = () => (
  <Field id="p-empty" noun="medication" legend="Which ones? (optional)" hint={HINT} initial={NO_CHIPS} />
);

/** Entries already added, each removable. */
export const WithEntries = () => (
  <Field
    id="p-entries"
    noun="medication"
    legend="Which ones? (optional)"
    hint={HINT}
    initial={{ items: ["Sertraline", "Propranolol", "Levothyroxine"], typing: "" }}
  />
);

/** Text typed but not yet added — it still counts when the form is sent. */
export const Typing = () => (
  <Field
    id="p-typing"
    noun="psychedelic"
    legend="Which ones have you used? (optional)"
    hint={HINT}
    initial={{ items: ["Psilocybin", "LSD"], typing: "Mescaline" }}
  />
);

/** At the limit: the input and the add button both go disabled. */
export const Full = () => (
  <Field
    id="p-full"
    noun="medication"
    legend="Which ones? (optional)"
    hint={`No more than ${MAX_CHIPS} entries.`}
    initial={{
      items: [
        "Sertraline", "Propranolol", "Levothyroxine", "Metformin", "Atorvastatin",
        "Omeprazole", "Amlodipine", "Ramipril", "Salbutamol", "Citalopram",
        "Fluoxetine", "Gabapentin", "Lamotrigine", "Naproxen", "Prednisolone",
        "Montelukast", "Bisoprolol", "Furosemide", "Warfarin", "Melatonin",
      ],
      typing: "",
    }}
  />
);
