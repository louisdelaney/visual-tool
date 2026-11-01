// A list answer typed one entry at a time: type one, press + (or Enter), and it becomes a chip
// that can be removed. Text typed but not yet added still counts (see chipValues).
import { useRef, type KeyboardEvent } from "react";

export interface Chips {
  items: string[];
  /** Typed but not yet added. */
  typing: string;
}

export const NO_CHIPS: Chips = { items: [], typing: "" };
export const MAX_CHIPS = 20;
export const MAX_CHIP_LENGTH = 100;

const clean = (s: string): string => s.trim().replace(/\s+/g, " ");
const has = (items: string[], s: string): boolean => items.some(i => i.toLowerCase() === s.toLowerCase());

/** The entries to send: the chips plus anything still typed, without repeats. Null if there are none. */
export function chipValues(c: Chips): string[] | null {
  const t = clean(c.typing);
  const items = t && !has(c.items, t) ? [...c.items, t] : c.items;
  return items.length ? items.slice(0, MAX_CHIPS) : null;
}

interface ChipInputProps {
  id: string;
  /** Names one entry, for the buttons: "medication" gives "Add medication" and "Remove …". */
  noun: string;
  value: Chips;
  onChange: (c: Chips) => void;
}

export function ChipInput({ id, noun, value, onChange }: ChipInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const full = value.items.length >= MAX_CHIPS;
  const add = (): void => {
    const t = clean(value.typing);
    if (!t || full) return;
    onChange({ items: has(value.items, t) ? value.items : [...value.items, t], typing: "" });
    input.current?.focus();
  };
  const remove = (i: number): void => {
    onChange({ ...value, items: value.items.filter((_, j) => j !== i) });
    input.current?.focus();
  };
  // Enter adds the entry instead of submitting the form.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };
  return (
    <div className="chip-input">
      {value.items.length > 0 && (
        <ul className="chips" aria-label={`Added: ${value.items.length}`}>
          {value.items.map((item, i) => (
            <li key={item} className="chip">
              <span>{item}</span>
              <button type="button" className="chip-remove" aria-label={`Remove ${item}`} onClick={() => remove(i)}>×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="inline">
        <input ref={input} type="text" id={id} maxLength={MAX_CHIP_LENGTH} autoComplete="off" disabled={full} value={value.typing} onChange={e => onChange({ ...value, typing: e.target.value })} onKeyDown={onKeyDown} />
        <button type="button" className="btn secondary chip-add" aria-label={`Add ${noun}`} disabled={full || !clean(value.typing)} onClick={add}>+</button>
      </div>
    </div>
  );
}
