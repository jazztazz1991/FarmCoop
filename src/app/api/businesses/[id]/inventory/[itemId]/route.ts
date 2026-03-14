import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { updateItemPrice, removeItem } from "@/domain/business/dealership/dealership.service";

export const PATCH = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const item = await updateItemPrice(user.id, params.id, params.itemId, body);
  return NextResponse.json(item);
});

export const DELETE = withAuth(async (_request, { user, params }) => {
  const item = await removeItem(user.id, params.id, params.itemId);
  return NextResponse.json(item);
});
