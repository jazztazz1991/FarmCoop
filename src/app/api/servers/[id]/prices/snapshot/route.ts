import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { snapshotPrices } from "@/domain/pricing/pricing.service";

/** POST /api/servers/[id]/prices/snapshot — snapshot current prices to history (cron/API key only) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId } = await params;
  const count = await snapshotPrices(gameServerId);
  return NextResponse.json({ snapshotted: count });
}
