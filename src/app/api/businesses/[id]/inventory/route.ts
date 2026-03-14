import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getInventory, addItem } from "@/domain/business/dealership/dealership.service";

export const GET = withAuth(async (_request, { params }) => {
  const inventory = await getInventory(params.id);
  return NextResponse.json(inventory);
});

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const item = await addItem(user.id, params.id, body);
  return NextResponse.json(item, { status: 201 });
});
