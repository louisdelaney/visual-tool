// What a store does, so the server and the export job can run on Firestore (db.ts) or in
// memory (db-memory.ts) without knowing which. The memory store is for development, tests and
// anyone trying the project without a Google Cloud account.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { SessionExportV1 } from "../../src/app/schema";
import type { GroupsDoc } from "./stats";
import type { SummaryRow } from "./summary";

export interface StoredSession {
  received_at: string;
  schema_version: number;
  test_version: number;
  body_gzip: Buffer;
  /** SHA-256 of the removal token POST /sessions returned. Never exported. Absent on sessions stored before removal existed. */
  delete_hash?: string;
}

/**
 * A secret that lets whoever sent a session remove it. The submission id can't do that: it's in
 * every history lookup and the public download. Only the hash is stored.
 */
export function newDeleteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDeleteToken(token) };
}

export const hashDeleteToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Whether a stored hash matches, in constant time. */
export function sameHash(stored: string | undefined, given: string): boolean {
  if (!stored || stored.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(given));
}

export interface Store {
  /** Stores a validated session and its derived rows. Returns the new submission id. */
  storeSession(s: SessionExportV1, now?: Date, deleteHash?: string): Promise<string>;
  /**
   * Removes a session, its summary row and its values in its group, if `deleteHash` matches the
   * one it was stored with. False if there's no such session or the hash doesn't match.
   */
  deleteSession(id: string, deleteHash: string): Promise<boolean>;
  readGroups(testVersion: number): Promise<GroupsDoc | undefined>;
  /** Every row stored with this (already normalised) pseudonym, oldest first. */
  historyFor(pseudonym: string, limit?: number): Promise<SummaryRow[]>;
  /** One stored session, or undefined if there's none with this id. */
  readSession(id: string): Promise<SessionExportV1 | undefined>;
  /** Every stored session in arrival order, for the export job. */
  allSessions(): AsyncGenerator<{ id: string; stored: StoredSession; session: SessionExportV1 }>;
}

/**
 * Firestore documents are capped at 1 MiB. A group's three arrays grow by 24 bytes a session,
 * so one test version fits about 40k sessions per group. Well before that the arrays need
 * sharding; this stops the write and logs it rather than failing in Firestore.
 */
export const MAX_GROUP_VALUES = 30_000;
