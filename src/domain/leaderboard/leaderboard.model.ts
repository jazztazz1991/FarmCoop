export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  career: string;
  value: string; // balance, count, or volume — always string for BigInt safety
}

export type LeaderboardType = "richest" | "top_traders" | "top_contractors";
