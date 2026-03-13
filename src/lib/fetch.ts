/**
 * Client-side fetch wrapper that auto-attaches the CSRF token header
 * for mutating requests (POST, PUT, PATCH, DELETE).
 */

const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf-token="));
  return match ? match.split("=")[1] : null;
}

/**
 * Drop-in replacement for `fetch` that attaches the CSRF token header
 * on mutating requests. Use this for all authenticated API calls from
 * dashboard pages.
 *
 * @param tokenFn - Override for testing; defaults to getCsrfToken
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  tokenFn: () => string | null = getCsrfToken
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);

  if (CSRF_METHODS.has(method)) {
    const token = tokenFn();
    if (token) {
      headers.set("X-CSRF-Token", token);
    }
  }

  return fetch(input, { ...init, headers });
}
