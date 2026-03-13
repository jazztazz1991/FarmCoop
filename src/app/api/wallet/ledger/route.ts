import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getLedger } from "@/domain/wallet/wallet.service";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit")) || 50;
  const entries = await getLedger(user.id, Math.min(limit, 100));
  return NextResponse.json(entries);
}
