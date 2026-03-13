import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "../fetch";

describe("apiFetch", () => {
  const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    mockFetch.mockClear();
    vi.unstubAllGlobals();
  });

  const withToken = (token: string | null) => () => token;

  it("passes through GET requests without CSRF header", async () => {
    await apiFetch("/api/test", undefined, withToken("some-token"));
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has("X-CSRF-Token")).toBe(false);
  });

  it("attaches CSRF token on POST requests", async () => {
    await apiFetch("/api/test", { method: "POST", body: "{}" }, withToken("abc123"));
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("X-CSRF-Token")).toBe("abc123");
  });

  it("attaches CSRF token on DELETE requests", async () => {
    await apiFetch("/api/test", { method: "DELETE" }, withToken("token456"));
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("X-CSRF-Token")).toBe("token456");
  });

  it("does not attach CSRF header when token is null", async () => {
    await apiFetch("/api/test", { method: "POST", body: "{}" }, withToken(null));
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has("X-CSRF-Token")).toBe(false);
  });

  it("attaches CSRF on PUT and PATCH methods", async () => {
    await apiFetch("/api/test", { method: "PUT" }, withToken("csrf-put"));
    let [, init] = mockFetch.mock.calls[0];
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("csrf-put");

    mockFetch.mockClear();
    await apiFetch("/api/test", { method: "PATCH" }, withToken("csrf-patch"));
    [, init] = mockFetch.mock.calls[0];
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("csrf-patch");
  });
});
