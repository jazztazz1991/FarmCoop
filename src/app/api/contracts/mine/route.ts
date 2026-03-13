import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getMyPostedContracts, getMyClaimedContracts } from "@/domain/contract/contract.service";

/** GET /api/contracts/mine?type=posted|claimed — get user's contracts */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "posted";

  if (type === "claimed") {
    const contracts = await getMyClaimedContracts(user.id);
    return NextResponse.json(contracts);
  }

  const contracts = await getMyPostedContracts(user.id);
  return NextResponse.json(contracts);
}
