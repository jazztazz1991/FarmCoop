import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { purchasePolicy, getPolicies } from "@/domain/business/insurance-co/insurance-co.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const policy = await purchasePolicy(user.id, params.id, body);
  return NextResponse.json(policy, { status: 201 });
});

export const GET = withAuth(async (_request, { user, params }) => {
  const policies = await getPolicies(user.id, params.id);
  return NextResponse.json(policies);
});
