import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { expireContracts } from "@/domain/contract/contract.service";

/** POST /api/contracts/expire — expire overdue contracts and refund escrow (cron/API key only) */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireContracts();
  return NextResponse.json({ expired: count });
}
