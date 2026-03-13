import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPriceHistory } from "@/domain/pricing/pricing.service";

/** GET /api/servers/[id]/prices/[commodityId]/history — get price history */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commodityId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId, commodityId } = await params;
  const history = await getPriceHistory(gameServerId, commodityId);
  return NextResponse.json(history);
}
