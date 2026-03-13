import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getLeaderboard } from "@/domain/leaderboard/leaderboard.service";
import type { LeaderboardType } from "@/domain/leaderboard/leaderboard.model";

const VALID_TYPES: LeaderboardType[] = ["richest", "top_traders", "top_contractors"];

/** GET /api/leaderboard?type=richest&limit=10 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "richest";
  const limitStr = request.nextUrl.searchParams.get("limit") ?? "10";
  const limit = Math.min(Math.max(parseInt(limitStr, 10) || 10, 1), 50);

  if (!VALID_TYPES.includes(type as LeaderboardType)) {
    return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 });
  }

  const entries = await getLeaderboard(type as LeaderboardType, limit);
  return NextResponse.json(entries);
}
