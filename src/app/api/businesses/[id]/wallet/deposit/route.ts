import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { depositToBusinessWallet } from "@/domain/business/business.service";

export const POST = withAuth(async (request, { user, params }) => {
  const { amount } = await request.json();
  await depositToBusinessWallet(user.id, params.id, amount);
  return NextResponse.json({ success: true }, { status: 200 });
});
