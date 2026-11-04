// Number and text formatting for the pages.
import { text } from "../text";

export const round = (v: number, d: number): number => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);

export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

/** Escapes text for the few places that still build HTML strings (stage messages). */
export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

type Num = number | null | undefined;

export const fmt = {
  pct(v: Num): string {
    if (v == null || !Number.isFinite(v)) return "–";
    return (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + "%";
  },
  fixed(v: Num, d: number): string {
    return v == null || !Number.isFinite(v) ? "–" : v.toFixed(d);
  },
  signed(v: Num, d: number): string {
    if (v == null || !Number.isFinite(v)) return "–";
    const r = Number(v.toFixed(d));
    return (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(d);
  },
  int(v: Num): string {
    return v == null ? "–" : Math.round(v).toLocaleString(text.common.locale);
  },
  time(iso: string): string {
    try { return new Date(iso).toLocaleString(text.common.locale, { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; }
  },
};

/** The browser and its major version, like "Chrome 131", from a user-agent string: no system or build. */
export function browserName(ua: string): string {
  const pick = (re: RegExp, name: string): string | null => { const m = re.exec(ua); return m ? `${name} ${m[1]}` : null; };
  return pick(/Edg\/(\d+)/, "Edge") || pick(/Firefox\/(\d+)/, "Firefox") || pick(/Chrome\/(\d+)/, "Chrome") || pick(/Version\/(\d+)[\d.]* .*Safari/, "Safari") || "Other";
}
