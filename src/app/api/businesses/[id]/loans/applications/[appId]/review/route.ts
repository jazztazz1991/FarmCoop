import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { reviewApplication } from "@/domain/business/bank/bank.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const result = await reviewApplication(user.id, params.id, params.appId, body);
  return NextResponse.json(result);
});
