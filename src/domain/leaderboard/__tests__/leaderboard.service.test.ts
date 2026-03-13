import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLeaderboard } from "../leaderboard.service";
import type { LeaderboardType } from "../leaderboard.model";

vi.mock("../leaderboard.repository", () => ({
  findRichestUsers: vi.fn(),
  findTopTraders: vi.fn(),
  findTopContractors: vi.fn(),
}));

import * as leaderboardRepo from "../leaderboard.repository";

const mockRepo = leaderboardRepo as unknown as {
  findRichestUsers: ReturnType<typeof vi.fn>;
  findTopTraders: ReturnType<typeof vi.fn>;
  findTopContractors: ReturnType<typeof vi.fn>;
};

const mockUser = (id: string, name: string) => ({
  id,
  displayName: name,
  avatarUrl: null,
  career: "farmer",
});

describe("getLeaderboard", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("richest", () => {
    it("returns ranked entries by wallet balance", async () => {
      mockRepo.findRichestUsers.mockResolvedValue([
        { balance: 50000n, user: mockUser("u1", "RichFarmer") },
        { balance: 30000n, user: mockUser("u2", "MediumFarmer") },
      ]);

      const result = await getLeaderboard("richest");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        rank: 1,
        userId: "u1",
        displayName: "RichFarmer",
        avatarUrl: null,
        career: "farmer",
        value: "50000",
      });
      expect(result[1].rank).toBe(2);
      expect(result[1].value).toBe("30000");
    });

    it("returns empty array when no wallets exist", async () => {
      mockRepo.findRichestUsers.mockResolvedValue([]);
      const result = await getLeaderboard("richest");
      expect(result).toEqual([]);
    });
  });

  describe("top_traders", () => {
    it("returns ranked entries by purchase count", async () => {
      mockRepo.findTopTraders.mockResolvedValue([
        { user: mockUser("u1", "TopTrader"), count: 25 },
        { user: mockUser("u2", "ActiveTrader"), count: 15 },
      ]);

      const result = await getLeaderboard("top_traders");
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].displayName).toBe("TopTrader");
      expect(result[0].value).toBe("25");
    });

    it("returns empty array when no trades", async () => {
      mockRepo.findTopTraders.mockResolvedValue([]);
      const result = await getLeaderboard("top_traders");
      expect(result).toEqual([]);
    });
  });

  describe("top_contractors", () => {
    it("returns ranked entries by completed contracts", async () => {
      mockRepo.findTopContractors.mockResolvedValue([
        { user: mockUser("u1", "BestHauler"), count: 12 },
      ]);

      const result = await getLeaderboard("top_contractors");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("12");
      expect(result[0].career).toBe("farmer");
    });
  });

  it("throws on unknown leaderboard type", async () => {
    await expect(
      getLeaderboard("invalid" as unknown as LeaderboardType)
    ).rejects.toThrow("Unknown leaderboard type");
  });

  it("passes limit to repository", async () => {
    mockRepo.findRichestUsers.mockResolvedValue([]);
    await getLeaderboard("richest", 5);
    expect(mockRepo.findRichestUsers).toHaveBeenCalledWith(5);
  });
});
