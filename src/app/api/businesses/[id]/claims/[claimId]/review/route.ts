import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { reviewClaim } from "@/domain/business/insurance-co/insurance-co.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const result = await reviewClaim(user.id, params.id, params.claimId, body);
  return NextResponse.json(result);
});
