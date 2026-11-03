// Keeps only what's needed to read a session's results (AGENTS.md, "What's collected"). The page
// already sends no more than that, but a page opened before it was trimmed, or a stored session
// from then, can carry exact times and details the results don't need. Each session is scrubbed
// before it's stored and again as the export is written, so neither keeps them.
import { durationS, toHour, type AnySessionExport } from "../../src/app/schema";

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => !!v && typeof v === "object" && !Array.isArray(v);

/** A copy with the start cut to its hour, a duration instead of the finish, and no dropped fields. */
export function scrubSession<T extends AnySessionExport>(session: T): T {
  const s = structuredClone(session) as unknown as Loose;
  if ("finished_at" in s) {
    const finished = typeof s.finished_at === "string" ? s.finished_at : null;
    s.duration_s ??= typeof s.started_at === "string" ? durationS(s.started_at, finished) : null;
    delete s.finished_at;
  }
  if (typeof s.started_at === "string") s.started_at = toHour(s.started_at);
  if (Array.isArray(s.trials)) for (const t of s.trials) if (isObj(t)) delete t.at;
  if (isObj(s.environment)) {
    const env = s.environment;
    delete env.language;
    delete env.screen;
    // "Chrome 131 on macOS" from older pages: the browser and major version only.
    if (typeof env.browser === "string") env.browser = env.browser.replace(/ on .*$/, "");
  }
  if (isObj(s.calibration)) delete s.calibration.measuredAt;
  if (isObj(s.contribution)) delete s.contribution.sent_at;
  return s as unknown as T;
}
