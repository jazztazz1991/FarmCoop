import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { postDeliveryRequest, getDeliveries } from "@/domain/business/trucking/trucking.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const contract = await postDeliveryRequest(user.id, params.id, body);
  return NextResponse.json(contract, { status: 201 });
});

export const GET = withAuth(async (_request, { user, params }) => {
  const contracts = await getDeliveries(user.id, params.id);
  return NextResponse.json(contracts);
});
