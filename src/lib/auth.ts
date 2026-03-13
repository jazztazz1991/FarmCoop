import { NextRequest } from "next/server";
import { validateSession } from "@/domain/auth/auth.service";
import type { UserDTO } from "@/domain/auth/auth.model";

/** Check API key authentication (for bridge service) */
export function isApiKeyAuthenticated(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) return false;
  if (!apiKey) return false;

  return apiKey === expectedKey;
}

/** Legacy alias — bridge routes still use this */
export const isAuthenticated = isApiKeyAuthenticated;

/** Get session token from cookie */
export function getSessionToken(request: NextRequest): string | null {
  return request.cookies.get("session")?.value ?? null;
}

/** Authenticate a user via session cookie. Returns UserDTO or null. */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<UserDTO | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  return validateSession(token);
}

/**
 * Check if request is authenticated by either session cookie OR API key.
 * Returns UserDTO if session auth, or true if API key auth, or null if neither.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<UserDTO | true | null> {
  // Try session cookie first
  const user = await getAuthenticatedUser(request);
  if (user) return user;

  // Fall back to API key
  if (isApiKeyAuthenticated(request)) return true;

  return null;
}
