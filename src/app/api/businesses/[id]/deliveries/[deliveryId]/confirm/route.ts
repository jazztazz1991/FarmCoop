import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { confirmDelivery } from "@/domain/business/trucking/trucking.service";

export const POST = withAuth(async (_request, { user, params }) => {
  const contract = await confirmDelivery(user.id, params.id, params.deliveryId);
  return NextResponse.json(contract);
});
