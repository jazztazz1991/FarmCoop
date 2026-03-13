import { NextRequest, NextResponse } from "next/server";
import { generalLimiter, authLimiter } from "@/lib/rate-limit";

/** Paths that do not require authentication */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/auth/discord",
  "/api/auth/discord/callback",
  "/api/health",
];

/** Paths that get stricter rate limiting */
const AUTH_PATHS = ["/api/auth/discord", "/api/auth/discord/callback"];

/** HTTP methods that require CSRF validation */
const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // ── Rate Limiting ───────────────────────────────────────
  const limiter = isAuthPath(pathname) ? authLimiter : generalLimiter;
  const rateResult = limiter.check(ip);

  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateResult.retryAfterSeconds),
        },
      }
    );
  }

  // ── Public paths — skip auth and CSRF ───────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Authentication Check ────────────────────────────────
  const hasSession = !!request.cookies.get("session")?.value;
  const hasApiKey = !!request.headers.get("x-api-key");

  if (!hasSession && !hasApiKey) {
    // Dashboard routes: redirect to login
    if (pathname.startsWith("/dashboard")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    // API routes: return 401
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── CSRF Protection ─────────────────────────────────────
  // Only for session-authenticated mutating requests (not API key / bridge)
  if (hasSession && !hasApiKey && CSRF_METHODS.has(request.method)) {
    const csrfCookie = request.cookies.get("csrf-token")?.value;
    const csrfHeader = request.headers.get("x-csrf-token");

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }

  // ── Attach rate limit headers ───────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
