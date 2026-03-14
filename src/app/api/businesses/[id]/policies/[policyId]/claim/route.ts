import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { fileClaim } from "@/domain/business/insurance-co/insurance-co.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const claim = await fileClaim(user.id, params.id, params.policyId, body);
  return NextResponse.json(claim, { status: 201 });
});
