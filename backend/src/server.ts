// The HTTP server. Configuration is by environment (see config.ts for BACKEND, DATA_FILE and
// EXPORT_DIR):
//   PORT            Cloud Run sets it; 8080 otherwise
//   ALLOWED_ORIGIN  the site's origin, the only one browsers may call from (or several, comma-separated)
//   EXPORT_URL      where GET /export redirects (the public visual-data.json). Without EXPORT_BUCKET
//                   it defaults to this server's own /export/visual-data.json (a relative redirect),
//                   served from EXPORT_DIR.
// Each response is logged as one anonymous line (see log.ts): method, route name, status, time and
// a random id, which failed requests also return in the body. Not the path, headers or address.
import { createReadStream, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join, normalize, resolve } from "node:path";
import { backendMode, exportDir as exportDirOf, openStore } from "./config";
import { cors, HttpError, sendJSON } from "./http";
import { EXPORT_FILE } from "./jobs/export";
import { logError, logInfo, logRequest } from "./log";
import { TokenBucket } from "./ratelimit";
import { Routes, type Reply } from "./routes";
import type { Store } from "./store";

export interface ServerOptions {
  allowedOrigin: string;
  exportUrl: string;
  db: Store;
  /** A folder to serve read-only at /export/* (exports written without a bucket), or none. */
  exportDir?: string;
  /** Per instance, per minute. */
  postsPerMinute?: number;
  getsPerMinute?: number;
}

export function createApp({ allowedOrigin, exportUrl, db, exportDir, postsPerMinute = 60, getsPerMinute = 600 }: ServerOptions) {
  const routes = new Routes(db, exportUrl);
  const posts = new TokenBucket(postsPerMinute);
  const gets = new TokenBucket(getsPerMinute);
  const files = exportDir ? resolve(exportDir) : null;

  /** The name of the route a path belongs to, or "unmatched". Never the path itself. */
  function routeOf(pathname: string): string {
    if (pathname === "/sessions" || pathname === "/healthz" || pathname === "/groups" || pathname === "/history" || pathname === "/export") return pathname;
    return files && pathname.startsWith("/export/") ? "/export/*" : "unmatched";
  }

  async function dispatch(req: IncomingMessage, url: URL): Promise<Reply> {
    const method = req.method ?? "GET";
    if (method === "POST" && url.pathname === "/sessions") {
      if (!posts.take()) throw new HttpError(429, "too many requests");
      return routes.postSession(req);
    }
    if (method === "GET" || method === "HEAD") {
      if (url.pathname === "/healthz") return { status: 200, body: { ok: true } };
      if (!gets.take()) throw new HttpError(429, "too many requests");
      if (url.pathname === "/groups") return routes.getGroups(url);
      if (url.pathname === "/history") return routes.getHistory(url);
      if (url.pathname === "/export") return routes.getExport();
      if (files && url.pathname.startsWith("/export/")) return serveFile(files, url.pathname.slice("/export/".length));
    }
    throw new HttpError(404, "not found");
  }

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const started = performance.now();
    const id = crypto.randomUUID();
    let route = "unmatched";
    res.once("finish", () => logRequest({ id, method: req.method ?? "", route, status: res.statusCode, ms: performance.now() - started }));
    // Failed requests carry the id in the body, so a person can quote it; it is tied to nothing about them.
    const fail = (status: number, error: string) => sendJSON(res, status, { error, id });
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      route = routeOf(url.pathname);
      if (!cors(req, res, allowedOrigin)) return fail(403, "origin not allowed");
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      const reply = await dispatch(req, url);
      if (reply.stream) {
        res.writeHead(reply.status, reply.headers);
        reply.stream.pipe(res);
        return;
      }
      if (reply.body === undefined) {
        res.writeHead(reply.status, { "Cache-Control": "no-store", ...reply.headers });
        res.end();
        return;
      }
      sendJSON(res, reply.status, reply.body, reply.headers);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.message);
      logError("request failed", err, id);
      fail(500, "internal error");
    }
  };
}

/** One file from the export folder, as the bucket would serve it: gzip-encoded JSON, as a download. */
function serveFile(dir: string, name: string): Reply {
  const path = normalize(join(dir, name));
  if (!path.startsWith(dir) || !/^[\w.-]+$/.test(name)) throw new HttpError(404, "not found");
  let size: number;
  try {
    size = statSync(path).size;
  } catch {
    throw new HttpError(404, "not found");
  }
  const headers: Record<string, string> = { "Content-Type": "application/json", "Content-Encoding": "gzip", "Content-Disposition": `attachment; filename="${name}"`, "Content-Length": String(size), "Cache-Control": "public, max-age=60" };
  return { status: 200, headers, stream: createReadStream(path) };
}

if (process.env.NODE_ENV !== "test" && process.argv[1] && /server\.(js|ts)$/.test(process.argv[1])) {
  const port = Number(process.env.PORT ?? 8080);
  const mode = backendMode();
  // With an EXPORT_URL (Cloud Run: the public bucket) nothing is served from here.
  const exportDir = process.env.EXPORT_URL ? undefined : (exportDirOf() ?? undefined);
  // Relative, so it points at whatever address the client reached this server by.
  const exportUrl = process.env.EXPORT_URL ?? (exportDir ? `/export/${EXPORT_FILE}` : "");
  openStore()
    .then(db => {
      const handle = createApp({ allowedOrigin: process.env.ALLOWED_ORIGIN ?? "", exportUrl, db, exportDir });
      createServer((req, res) => void handle(req, res)).listen(port, () => logInfo(`listening on ${port} (${mode})`));
    })
    .catch(err => {
      logError("could not start", err);
      process.exit(1);
    });
}
