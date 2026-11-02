// Sending a contributed session to the backend when the tasks finish, and removing it again.
import type { Session } from "./types";
import { exportObject } from "./export";
import { getState, touch } from "./store";
import { API_URL, deleteSession, postSession } from "./api";
import { ApiError } from "./failure";

/** POSTs the session if its participant chose to contribute. Safe to call again to retry. */
export async function sendContribution(s: Session): Promise<void> {
  const c = s.contribution;
  if (!c || !c.contribute || c.sent_at || c.sending || !API_URL) return;
  c.sending = true;
  c.failed = false;
  delete c.failure_id;
  touch();
  try {
    // The backend picks the id; the reference shown on the results page must be that one.
    const sent = await postSession(exportObject(s));
    c.submission_id = sent.id;
    if (sent.deleteToken) c.delete_token = sent.deleteToken;
    c.sent_at = new Date().toISOString();
  } catch (err) {
    c.failed = true;
    if (err instanceof ApiError && err.id) c.failure_id = err.id;
  }
  c.sending = false;
  if (getState().session === s) touch();
}

/** Removes a sent session from the database. Safe to call again to retry. */
export async function removeContribution(s: Session): Promise<void> {
  const c = s.contribution;
  if (!c || !c.contribute || !c.sent_at || !c.delete_token || c.removal === "removing" || c.removal === "removed") return;
  c.removal = "removing";
  delete c.failure_id;
  touch();
  try {
    await deleteSession(c.submission_id, c.delete_token);
    c.removal = "removed";
    delete c.delete_token;
  } catch (err) {
    c.removal = "failed";
    if (err instanceof ApiError && err.id) c.failure_id = err.id;
  }
  if (getState().session === s) touch();
}
