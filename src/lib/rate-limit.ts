/**
 * In-memory sliding-window rate limiter.
 * Each limiter instance tracks requests per key (typically IP address).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.limit = options.limit;
    this.windowMs = options.windowSeconds * 1000;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfterSeconds: 0 };
    }

    if (entry.count < this.limit) {
      entry.count++;
      const remaining = this.limit - entry.count;
      return { allowed: true, remaining, retryAfterSeconds: 0 };
    }

    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  /** Periodically purge expired entries to prevent memory leaks */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

/** General API rate limiter: 100 requests per 60 seconds */
export const generalLimiter = new RateLimiter({ limit: 100, windowSeconds: 60 });

/** Auth endpoint rate limiter: 5 requests per 60 seconds */
export const authLimiter = new RateLimiter({ limit: 5, windowSeconds: 60 });

// Cleanup expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    generalLimiter.cleanup();
    authLimiter.cleanup();
  }, 60_000).unref?.();
}
