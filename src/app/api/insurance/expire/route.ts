import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { expirePolicies } from "@/domain/insurance/insurance.service";

/** POST /api/insurance/expire — cron: expire policies past their term */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiredCount = await expirePolicies();

  return NextResponse.json({
    policiesExpired: expiredCount,
  });
}
