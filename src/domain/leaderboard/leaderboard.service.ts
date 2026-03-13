import type { LeaderboardEntryDTO, LeaderboardType } from "./leaderboard.model";
import * as leaderboardRepo from "./leaderboard.repository";

export async function getLeaderboard(
  type: LeaderboardType,
  limit = 10
): Promise<LeaderboardEntryDTO[]> {
  switch (type) {
    case "richest":
      return getRichest(limit);
    case "top_traders":
      return getTopTraders(limit);
    case "top_contractors":
      return getTopContractors(limit);
    default:
      throw new Error(`Unknown leaderboard type: ${type}`);
  }
}

async function getRichest(limit: number): Promise<LeaderboardEntryDTO[]> {
  const results = await leaderboardRepo.findRichestUsers(limit);
  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.user.id,
    displayName: r.user.displayName,
    avatarUrl: r.user.avatarUrl,
    career: r.user.career,
    value: r.balance.toString(),
  }));
}

async function getTopTraders(limit: number): Promise<LeaderboardEntryDTO[]> {
  const results = await leaderboardRepo.findTopTraders(limit);
  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.user.id,
    displayName: r.user.displayName,
    avatarUrl: r.user.avatarUrl,
    career: r.user.career,
    value: r.count.toString(),
  }));
}

async function getTopContractors(limit: number): Promise<LeaderboardEntryDTO[]> {
  const results = await leaderboardRepo.findTopContractors(limit);
  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.user.id,
    displayName: r.user.displayName,
    avatarUrl: r.user.avatarUrl,
    career: r.user.career,
    value: r.count.toString(),
  }));
}
