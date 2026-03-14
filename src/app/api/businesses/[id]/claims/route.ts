import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getClaimsForReview } from "@/domain/business/insurance-co/insurance-co.service";

export const GET = withAuth(async (_request, { user, params }) => {
  const claims = await getClaimsForReview(user.id, params.id);
  return NextResponse.json(claims);
});
