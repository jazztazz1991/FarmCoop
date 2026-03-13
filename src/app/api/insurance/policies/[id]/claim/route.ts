import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { fileClaim } from "@/domain/insurance/insurance.service";

/** POST /api/insurance/policies/[id]/claim — file a claim */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: policyId } = await params;
    const { claimAmount, reason } = await request.json();
    const claim = await fileClaim(user.id, { policyId, claimAmount, reason });
    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
