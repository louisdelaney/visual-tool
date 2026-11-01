// Errors only, one JSON line each, in the shape Cloud Logging reads. Never a request body, a
// header, a pseudonym or a URL with its query string: the Privacy and risks page promises that
// nothing but the session itself is kept, and application logs are kept.
export function logError(message: string, err?: unknown): void {
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : err === undefined ? undefined : String(err);
  process.stderr.write(JSON.stringify({ severity: "ERROR", message, ...(detail ? { detail } : {}) }) + "\n");
}

export function logInfo(message: string): void {
  process.stderr.write(JSON.stringify({ severity: "INFO", message }) + "\n");
}
