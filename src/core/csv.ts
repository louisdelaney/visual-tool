// CSV export with RFC 4180 quoting.

export function toCSV<T extends object>(rows: readonly T[], columns: readonly (keyof T & string)[]): string {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [columns.join(","), ...rows.map(r => columns.map(c => esc(r[c])).join(","))].join("\n");
}
