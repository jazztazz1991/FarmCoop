import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSavings } from "@/domain/banking/banking.service";

/** GET /api/banking/savings?gameServerId=xxx — get savings account */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameServerId = request.nextUrl.searchParams.get("gameServerId");
  if (!gameServerId) {
    return NextResponse.json({ error: "gameServerId required" }, { status: 400 });
  }

  const savings = await getSavings(user.id, gameServerId);
  return NextResponse.json(savings);
}
