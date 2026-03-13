import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getMyClaims } from "@/domain/insurance/insurance.service";

/** GET /api/insurance/claims — list my claims */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claims = await getMyClaims(user.id);
  return NextResponse.json(claims);
}
