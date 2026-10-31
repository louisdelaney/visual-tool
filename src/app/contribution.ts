// Sending a contributed session to the backend when the tasks finish.
import type { Session } from "./types";
import { exportObject } from "./export";
import { getState, touch } from "./store";
import { API_URL, postSession } from "./api";

/** POSTs the session if its participant chose to contribute. Safe to call again to retry. */
export async function sendContribution(s: Session): Promise<void> {
  const c = s.contribution;
  if (!c || !c.contribute || c.sent_at || c.sending || !API_URL) return;
  c.sending = true;
  c.failed = false;
  touch();
  try {
    // The backend picks the id; the reference shown on the results page must be that one.
    c.submission_id = await postSession(exportObject(s));
    c.sent_at = new Date().toISOString();
  } catch {
    c.failed = true;
  }
  c.sending = false;
  if (getState().session === s) touch();
}
