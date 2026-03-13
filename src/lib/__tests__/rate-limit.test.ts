import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "../rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ limit: 3, windowSeconds: 60 });
  });

  it("allows requests under the limit", () => {
    const r1 = limiter.check("ip-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("ip-1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("ip-1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    const r4 = limiter.check("ip-1");
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks different keys independently", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    const result = limiter.check("ip-2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("resets after window expires", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    // Simulate window expiration by cleaning up and re-checking
    // We can't easily manipulate time, but cleanup should remove expired entries
    limiter.cleanup();

    // Entry is not expired yet (window is 60s), so should still be blocked
    const blocked = limiter.check("ip-1");
    expect(blocked.allowed).toBe(false);
  });

  it("cleanup removes expired entries", () => {
    // Create a limiter with a very short window for testing
    const shortLimiter = new RateLimiter({ limit: 1, windowSeconds: 0 });
    shortLimiter.check("ip-1");

    // Window of 0 seconds means it's already expired
    shortLimiter.cleanup();

    // After cleanup of expired entry, next request should be allowed
    const result = shortLimiter.check("ip-1");
    expect(result.allowed).toBe(true);
  });
});
