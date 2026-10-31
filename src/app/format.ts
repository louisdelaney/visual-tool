// Number and text formatting for the pages.

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
    return v == null ? "–" : Math.round(v).toLocaleString("en-GB");
  },
  time(iso: string): string {
    try { return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; }
  },
};

/** "Chrome 131 on macOS" from a user-agent string. */
export function shortUA(ua: string): string {
  const pick = (re: RegExp, name: string): string | null => { const m = re.exec(ua); return m ? `${name} ${m[1]}` : null; };
  const browser = pick(/Edg\/(\d+)/, "Edge") || pick(/Firefox\/(\d+)/, "Firefox") || pick(/Chrome\/(\d+)/, "Chrome") || pick(/Version\/(\d+)[\d.]* Safari/, "Safari") || "Unknown browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "unknown system";
  return `${browser} on ${os}`;
}
