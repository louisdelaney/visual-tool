// What a store does, so the server and the export job can run on Firestore (db.ts) or in
// memory (db-memory.ts) without knowing which. The memory store is for development, tests and
// anyone trying the project without a Google Cloud account.
import type { SessionExportV1 } from "../../src/app/schema";
import type { GroupsDoc } from "./stats";
import type { SummaryRow } from "./summary";

export interface StoredSession {
  received_at: string;
  schema_version: number;
  test_version: number;
  body_gzip: Buffer;
}

export interface Store {
  /** Stores a validated session and its derived rows. Returns the new submission id. */
  storeSession(s: SessionExportV1, now?: Date): Promise<string>;
  readGroups(testVersion: number): Promise<GroupsDoc | undefined>;
  /** Every row stored with this (already normalised) pseudonym, oldest first. */
  historyFor(pseudonym: string, limit?: number): Promise<SummaryRow[]>;
  /** Every stored session in arrival order, for the export job. */
  allSessions(): AsyncGenerator<{ id: string; stored: StoredSession; session: SessionExportV1 }>;
}

/**
 * Firestore documents are capped at 1 MiB. A group's three arrays grow by 24 bytes a session,
 * so one test version fits about 40k sessions per group. Well before that the arrays need
 * sharding; this stops the write and logs it rather than failing in Firestore.
 */
export const MAX_GROUP_VALUES = 30_000;
