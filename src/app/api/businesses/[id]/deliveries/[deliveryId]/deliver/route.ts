import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { markDelivered } from "@/domain/business/trucking/trucking.service";

export const POST = withAuth(async (_request, { user, params }) => {
  const contract = await markDelivered(user.id, params.id, params.deliveryId);
  return NextResponse.json(contract);
});
