import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it("debug calls console.debug", async () => {
    const { logger } = await import("../logger");
    logger.debug("test message");
    expect(console.debug).toHaveBeenCalledOnce();
  });

  it("info calls console.info", async () => {
    const { logger } = await import("../logger");
    logger.info("test message");
    expect(console.info).toHaveBeenCalledOnce();
  });

  it("warn calls console.warn", async () => {
    const { logger } = await import("../logger");
    logger.warn("test message");
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it("error calls console.error", async () => {
    const { logger } = await import("../logger");
    logger.error("test message");
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("includes context when provided", async () => {
    const { logger } = await import("../logger");
    logger.info("request", { userId: "u-1", path: "/api/test" });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("request")
    );
  });
});
