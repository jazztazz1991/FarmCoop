import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getLoans } from "@/domain/business/bank/bank.service";

export const GET = withAuth(async (_request, { user, params }) => {
  const loans = await getLoans(user.id, params.id);
  return NextResponse.json(loans);
});
