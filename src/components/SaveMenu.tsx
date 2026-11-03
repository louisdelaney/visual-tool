// A floppy-disk button that opens a short menu of files to save, pinned to the top-right corner
// of its card. Closes on Escape, on a click anywhere else, and once something is picked; what
// happened ("Getting the data…", "Making the PDF…", "Saved …", or why it couldn't) shows in a small note under the
// button, which clears itself after a few seconds.
import { useEffect, useRef, useState } from "react";

export interface SaveOption {
  id?: string;
  label: string;
  /** One line on what the file holds. */
  description: string;
  /** Saves the file and returns its name. A promise if the data has to be fetched first; it
   * rejects with an Error whose message is shown. */
  save: () => string | Promise<string>;
  /** What the note says while a promised save is under way. */
  pending?: string;
}

/**
 * A 3.5-inch floppy disk: body with its cut corner, the metal shutter and its slot, and the label.
 * Drawn on a 28-unit grid shown at 28px, with 2px strokes on whole coordinates, so lines sit on
 * the pixel grid and stay sharp.
 */
const GETTING = "Getting the data…";

const DiskIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h14l5 5v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
    <path d="M9 3v6h10V3" />
    <path d="M15 5v2" />
    <path d="M7 25v-8h14v8" />
    <path d="M10 21h8" />
  </svg>
);

interface SaveMenuProps {
  options: readonly SaveOption[];
  label?: string;
  /** The button's id, where a page has only one. */
  id?: string;
  /** Words shown beside the disk, where the icon alone wouldn't say enough. */
  text?: string;
}

export function SaveMenu({ options, label = "Save your results", id, text }: SaveMenuProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    wrap.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    const away = (e: PointerEvent): void => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape") { setOpen(false); button.current?.focus(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [...(wrap.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
      const i = items.indexOf(document.activeElement as HTMLButtonElement);
      items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
      e.preventDefault();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", key); };
  }, [open]);

  // The note clears itself: soon after a save, later after an error so there's time to read it.
  useEffect(() => {
    if (!status || busy) return;
    const t = setTimeout(() => setStatus(""), status.startsWith("Saved") ? 4000 : 10000);
    return () => clearTimeout(t);
  }, [status, busy]);

  const pick = async (o: SaveOption): Promise<void> => {
    setOpen(false);
    button.current?.focus();
    const saving = o.save();
    if (typeof saving === "string") { setStatus(`Saved ${saving}.`); return; }
    setStatus(o.pending ?? GETTING);
    setBusy(true);
    try {
      setStatus(`Saved ${await saving}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Couldn't save it.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="save-menu" ref={wrap}>
      <button type="button" className={text ? "save-btn with-text" : "save-btn"} id={id} ref={button} aria-label={text ? undefined : label} title={label}
        aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <DiskIcon />
        {text && <span>{text}</span>}
      </button>
      <span className="save-status" role="status" aria-live="polite">{!open && status}</span>
      {open && (
        <div className="save-list" role="menu" aria-label={label}>
          {options.map(o => (
            <button key={o.label} type="button" role="menuitem" id={o.id} onClick={() => void pick(o)}>
              <span className="save-label">{o.label}</span>
              <span className="save-desc">{o.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
