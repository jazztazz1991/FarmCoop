import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { completeOrders } from "@/domain/production/production.service";

/** POST /api/production/complete — cron: complete orders past their completesAt */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await completeOrders();

  return NextResponse.json({
    ordersCompleted: count,
  });
}
