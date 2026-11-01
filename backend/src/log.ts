// One JSON line each, in the shape Cloud Logging reads. Application logs are kept (7 days), and the
// Privacy and risks page promises that nothing but the session itself is kept, so what is written
// is limited to:
//   - errors and start-up messages (logError, logInfo)
//   - one anonymous line per response (logRequest): the method, the name of the matched route, the
//     status, the duration and a random id made here. Failed requests give the same id to the
//     caller in the error body, so a person can quote it when they report a problem.
// Never written: a request body, any header (User-Agent, Sec-CH-UA, Accept-Language,
// X-Forwarded-For, X-Cloud-Trace-Context), an IP address, a pseudonym, or a URL's path or query
// string. A path the router doesn't know is logged as "unmatched".
/** `id` ties the line to the request line (and the error body) of the request that failed. */
export function logError(message: string, err?: unknown, id?: string): void {
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : err === undefined ? undefined : String(err);
  process.stderr.write(JSON.stringify({ severity: "ERROR", message, ...(id ? { id } : {}), ...(detail ? { detail } : {}) }) + "\n");
}

export function logInfo(message: string): void {
  process.stderr.write(JSON.stringify({ severity: "INFO", message }) + "\n");
}

export interface RequestInfo {
  /** Random, made by the app for this request alone. */
  id: string;
  method: string;
  /** The matched route's name ("/sessions"), or "unmatched". Never the raw path. */
  route: string;
  status: number;
  ms: number;
}

const METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"]);

/** Logs a finished request. Any method name that isn't a standard one is written as "other". */
export function logRequest({ id, method, route, status, ms }: RequestInfo): void {
  const severity = status >= 500 ? "ERROR" : status >= 400 ? "WARNING" : "INFO";
  process.stderr.write(JSON.stringify({ severity, message: "request", method: METHODS.has(method) ? method : "other", route, status, ms: Math.round(ms), id }) + "\n");
}
