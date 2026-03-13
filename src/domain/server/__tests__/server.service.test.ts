import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerServer, listActiveServers, getServer, toDTO } from "../server.service";

vi.mock("../server.repository", () => ({
  createServer: vi.fn(),
  findActiveServers: vi.fn(),
  findServerById: vi.fn(),
}));

import * as serverRepo from "../server.repository";

const mockServer = {
  id: "server-1",
  name: "Test Server",
  transportType: "local",
  isActive: true,
  createdAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toDTO", () => {
  it("returns only allowlisted fields", () => {
    const dto = toDTO(mockServer);
    expect(dto).toEqual(mockServer);
    expect(dto).not.toHaveProperty("transportConfig");
  });
});

describe("registerServer", () => {
  it("creates a server with valid input", async () => {
    vi.mocked(serverRepo.createServer).mockResolvedValue(mockServer);

    const result = await registerServer({
      name: "Test Server",
      transportType: "local",
      transportConfig: { path: "/some/path" },
    });

    expect(result.id).toBe("server-1");
    expect(serverRepo.createServer).toHaveBeenCalled();
  });

  it("rejects invalid transport type", async () => {
    await expect(
      registerServer({
        name: "Test",
        transportType: "invalid" as "local",
        transportConfig: {},
      })
    ).rejects.toThrow();
  });

  it("rejects empty name", async () => {
    await expect(
      registerServer({
        name: "",
        transportType: "local",
        transportConfig: {},
      })
    ).rejects.toThrow();
  });
});

describe("listActiveServers", () => {
  it("returns active servers as DTOs", async () => {
    vi.mocked(serverRepo.findActiveServers).mockResolvedValue([mockServer]);

    const result = await listActiveServers();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Server");
  });
});

describe("getServer", () => {
  it("returns server DTO", async () => {
    vi.mocked(serverRepo.findServerById).mockResolvedValue(mockServer);

    const result = await getServer("server-1");
    expect(result?.id).toBe("server-1");
  });

  it("returns null for non-existent server", async () => {
    vi.mocked(serverRepo.findServerById).mockResolvedValue(null);

    const result = await getServer("nonexistent");
    expect(result).toBeNull();
  });
});
