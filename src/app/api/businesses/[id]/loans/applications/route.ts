import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { applyForLoan, getApplications } from "@/domain/business/bank/bank.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const application = await applyForLoan(user.id, params.id, body);
  return NextResponse.json(application, { status: 201 });
});

export const GET = withAuth(async (_request, { user, params }) => {
  const applications = await getApplications(user.id, params.id);
  return NextResponse.json(applications);
});
