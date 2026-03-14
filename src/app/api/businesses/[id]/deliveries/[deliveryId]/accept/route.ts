import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { acceptDelivery } from "@/domain/business/trucking/trucking.service";

export const POST = withAuth(async (_request, { user, params }) => {
  const contract = await acceptDelivery(user.id, params.id, params.deliveryId);
  return NextResponse.json(contract);
});
