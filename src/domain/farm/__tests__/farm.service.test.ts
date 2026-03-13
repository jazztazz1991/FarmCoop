import { describe, it, expect, vi, beforeEach } from "vitest";
import { claimFarm, releaseFarm, getMyFarms, toDTO } from "../farm.service";

vi.mock("../farm.repository", () => ({
  createFarm: vi.fn(),
  findFarmByServerAndSlot: vi.fn(),
  findFarmsByUser: vi.fn(),
  findFarmById: vi.fn(),
  deleteFarm: vi.fn(),
}));

vi.mock("../../server/server.repository", () => ({
  findServerById: vi.fn(),
}));

import * as farmRepo from "../farm.repository";
import * as serverRepo from "../../server/server.repository";

const mockFarm = {
  id: "farm-1",
  gameServerId: "server-1",
  userId: "user-1",
  farmSlot: 1,
  name: "My Farm",
  createdAt: new Date("2026-01-01"),
};

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
    const dto = toDTO(mockFarm);
    expect(dto).toEqual(mockFarm);
  });
});

describe("claimFarm", () => {
  it("creates a farm when slot is available", async () => {
    vi.mocked(serverRepo.findServerById).mockResolvedValue(mockServer);
    vi.mocked(farmRepo.findFarmByServerAndSlot).mockResolvedValue(null);
    vi.mocked(farmRepo.createFarm).mockResolvedValue(mockFarm);

    const result = await claimFarm("user-1", "server-1", {
      farmSlot: 1,
      name: "My Farm",
    });

    expect(result.id).toBe("farm-1");
    expect(farmRepo.createFarm).toHaveBeenCalledWith({
      gameServerId: "server-1",
      userId: "user-1",
      farmSlot: 1,
      name: "My Farm",
    });
  });

  it("throws if server not found", async () => {
    vi.mocked(serverRepo.findServerById).mockResolvedValue(null);

    await expect(
      claimFarm("user-1", "server-1", { farmSlot: 1, name: "My Farm" })
    ).rejects.toThrow("Server not found");
  });

  it("throws if server is not active", async () => {
    vi.mocked(serverRepo.findServerById).mockResolvedValue({
      ...mockServer,
      isActive: false,
    });

    await expect(
      claimFarm("user-1", "server-1", { farmSlot: 1, name: "My Farm" })
    ).rejects.toThrow("Server is not active");
  });

  it("throws if farm slot already claimed", async () => {
    vi.mocked(serverRepo.findServerById).mockResolvedValue(mockServer);
    vi.mocked(farmRepo.findFarmByServerAndSlot).mockResolvedValue(mockFarm);

    await expect(
      claimFarm("user-1", "server-1", { farmSlot: 1, name: "My Farm" })
    ).rejects.toThrow("Farm slot already claimed");
  });

  it("rejects invalid farm slot", async () => {
    await expect(
      claimFarm("user-1", "server-1", { farmSlot: 0, name: "My Farm" })
    ).rejects.toThrow();

    await expect(
      claimFarm("user-1", "server-1", { farmSlot: 17, name: "My Farm" })
    ).rejects.toThrow();
  });
});

describe("releaseFarm", () => {
  it("deletes the farm if owned by user", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue(mockFarm);
    vi.mocked(farmRepo.deleteFarm).mockResolvedValue({} as never);

    await releaseFarm("user-1", "farm-1");
    expect(farmRepo.deleteFarm).toHaveBeenCalledWith("farm-1");
  });

  it("throws if farm not found", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue(null);

    await expect(releaseFarm("user-1", "farm-1")).rejects.toThrow(
      "Farm not found"
    );
  });

  it("throws if not owner", async () => {
    vi.mocked(farmRepo.findFarmById).mockResolvedValue({
      ...mockFarm,
      userId: "other-user",
    });

    await expect(releaseFarm("user-1", "farm-1")).rejects.toThrow(
      "Not your farm"
    );
  });
});

describe("getMyFarms", () => {
  it("returns user farms as DTOs", async () => {
    vi.mocked(farmRepo.findFarmsByUser).mockResolvedValue([mockFarm]);

    const result = await getMyFarms("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("farm-1");
  });
});
