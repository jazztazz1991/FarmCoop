import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isApiKeyAuthenticated } from "@/lib/auth";
import { getPrices, setBasePrice } from "@/domain/pricing/pricing.service";
import { ZodError } from "zod";

/** GET /api/servers/[id]/prices — list all commodity prices for a server */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId } = await params;
  const prices = await getPrices(gameServerId);
  return NextResponse.json(prices);
}

/** POST /api/servers/[id]/prices — set base price for a commodity (admin only) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: gameServerId } = await params;

  try {
    const body = await request.json();
    const price = await setBasePrice(gameServerId, body);
    return NextResponse.json(price, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
