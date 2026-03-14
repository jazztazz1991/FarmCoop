import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { purchaseItem } from "@/domain/business/dealership/dealership.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const item = await purchaseItem(user.id, params.id, params.itemId, body);
  return NextResponse.json(item);
});
