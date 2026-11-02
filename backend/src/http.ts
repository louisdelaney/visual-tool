// Small pieces of the HTTP layer: reading a capped body, writing JSON, CORS for one origin.
import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** Reads the body as text, failing fast past `max` bytes, before or during the read. */
export function readBody(req: IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > max) return reject(new HttpError(413, "body too large"));
    const chunks: Buffer[] = [];
    let size = 0;
    let rejected = false;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > max) {
        // Discard the rest rather than close on it, so the client can read the 413 (closing
        // mid-upload shows as a reset instead). Cloud Run caps requests at 32 MB anyway.
        chunks.length = 0;
        if (!rejected) reject(new HttpError(413, "body too large"));
        rejected = true;
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function sendJSON(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(text), "Cache-Control": "no-store", ...headers });
  res.end(text);
}

/**
 * Allows the site's origin only: `allowed` is one origin, or several separated by commas (two dev
 * servers on one backend). Requests with no Origin (curl, the export job's health check) get no
 * CORS headers and are served normally: CORS protects browsers, not the data, which is public.
 */
export function cors(req: IncomingMessage, res: ServerResponse, allowed: string): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (!allowed.split(",").map(o => o.trim()).includes(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
  return true;
}
