// The HTTP server. Configuration is by environment (see config.ts for BACKEND and DATA_FILE):
//   PORT            Cloud Run sets it; 8080 otherwise
//   ALLOWED_ORIGIN  the site's origin, the only one browsers may call from (or several, comma-separated)
//   EXPORT_URL      where GET /export redirects (on Cloud Run, the file on the GitHub "data"
//                   release). Without it, and off Cloud Run, GET /export builds the file from the
//                   store on each request, with the nightly job's code, so a local copy needs no
//                   export step. Cloud Run never does that: it reads every stored session.
// Each response is logged as one anonymous line (see log.ts): method, route name, status, time and
// a random id, which failed requests also return in the body. Not the path, headers or address.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { backendMode, openStore } from "./config";
import { cors, HttpError, sendJSON } from "./http";
import { logError, logInfo, logRequest } from "./log";
import { TokenBucket } from "./ratelimit";
import { Routes, type Reply } from "./routes";
import type { Store } from "./store";

export interface ServerOptions {
  allowedOrigin: string;
  exportUrl: string;
  db: Store;
  /** Without an exportUrl, build the export on each GET /export (local copies only). */
  liveExport?: boolean;
  /** Per instance, per minute; removals share the posts' limit. History has its own limit because each lookup reads up to 50 rows. */
  postsPerMinute?: number;
  getsPerMinute?: number;
  historyPerMinute?: number;
}

export function createApp({ allowedOrigin, exportUrl, db, liveExport = false, postsPerMinute = 10, getsPerMinute = 600, historyPerMinute = 60 }: ServerOptions) {
  const routes = new Routes(db, exportUrl, liveExport);
  const posts = new TokenBucket(postsPerMinute);
  const gets = new TokenBucket(getsPerMinute);
  const histories = new TokenBucket(historyPerMinute);

  /** The name of the route a path belongs to, or "unmatched". Never the path itself. */
  function routeOf(pathname: string): string {
    if (pathname === "/sessions" || pathname === "/healthz" || pathname === "/groups" || pathname === "/history" || pathname === "/export") return pathname;
    return "unmatched";
  }

  async function dispatch(req: IncomingMessage, url: URL): Promise<Reply> {
    const method = req.method ?? "GET";
    if (method === "POST" && url.pathname === "/sessions") {
      if (!posts.take()) throw new HttpError(429, "too many requests");
      return routes.postSession(req);
    }
    if (method === "DELETE" && url.pathname === "/sessions") {
      if (!posts.take()) throw new HttpError(429, "too many requests");
      return routes.deleteSession(req);
    }
    if (method === "GET" || method === "HEAD") {
      if (url.pathname === "/healthz") return { status: 200, body: { ok: true } };
      if (url.pathname === "/history") {
        if (!histories.take()) throw new HttpError(429, "too many requests");
        return routes.getHistory(url);
      }
      if (!gets.take()) throw new HttpError(429, "too many requests");
      if (url.pathname === "/groups") return routes.getGroups();
      if (url.pathname === "/export") return routes.getExport();
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

if (process.env.NODE_ENV !== "test" && process.argv[1] && /server\.(js|ts)$/.test(process.argv[1])) {
  const port = Number(process.env.PORT ?? 8080);
  const mode = backendMode();
  const exportUrl = process.env.EXPORT_URL ?? "";
  const liveExport = !exportUrl && !process.env.K_SERVICE;
  openStore()
    .then(db => {
      const handle = createApp({ allowedOrigin: process.env.ALLOWED_ORIGIN ?? "", exportUrl, db, liveExport });
      createServer((req, res) => void handle(req, res)).listen(port, () => logInfo(`listening on ${port} (${mode})`));
    })
    .catch(err => {
      logError("could not start", err);
      process.exit(1);
    });
}
