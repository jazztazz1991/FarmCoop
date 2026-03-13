import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { expireListings } from "@/domain/marketplace/listing.service";

/** Bridge/cron-only endpoint to expire old listings */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireListings();
  return NextResponse.json({ expired: count });
}
