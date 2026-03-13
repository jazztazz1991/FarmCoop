import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrice } from "@/domain/pricing/pricing.service";

/** GET /api/servers/[id]/prices/[commodityId] — get a single commodity price */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commodityId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId, commodityId } = await params;
  const price = await getPrice(gameServerId, commodityId);

  if (!price) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(price);
}
