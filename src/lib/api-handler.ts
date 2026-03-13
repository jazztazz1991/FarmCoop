import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/domain/errors";
import { getAuthenticatedUser, authenticateRequest } from "@/lib/auth";
import type { UserDTO } from "@/domain/auth/auth.model";

type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: UserDTO; params: Record<string, string> }
) => Promise<NextResponse>;

type ApiKeyOrSessionHandler = (
  request: NextRequest,
  context: { auth: UserDTO | true; params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with:
 * - Authentication (session-only by default)
 * - Centralized error handling (Zod → 400, AppError → status, unknown → 500)
 * - Params extraction (awaits the Next.js 16 Promise-based params)
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const user = await getAuthenticatedUser(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const resolvedParams = await params;
      return await handler(request, { user, params: resolvedParams });
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Like withAuth, but also accepts API-key authentication (for bridge routes).
 */
export function withApiAuth(handler: ApiKeyOrSessionHandler) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const auth = await authenticateRequest(request);
      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const resolvedParams = await params;
      return await handler(request, { auth, params: resolvedParams });
    } catch (error) {
      return handleError(error);
    }
  };
}

function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Unknown errors — log server-side, return generic message
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
