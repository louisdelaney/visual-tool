// The reference the backend puts in an error response, so a person can quote it when they report a
// problem. It is random and tied to nothing about them. The response is untrusted: only a short
// plain string is accepted, since it is shown on the page.

/** The `id` of a backend error response, or null when it has none that is safe to show. */
export function parseErrorId(body: unknown): string | null {
  const id = typeof body === "object" && body !== null ? (body as { id?: unknown }).id : undefined;
  return typeof id === "string" && /^[\w-]{8,64}$/.test(id) ? id : null;
}

/** A failed request, with the backend's reference for it when it gave one. */
export class ApiError extends Error {
  constructor(message: string, readonly id: string | null = null) {
    super(message);
  }
}
