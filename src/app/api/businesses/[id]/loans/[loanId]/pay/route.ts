import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { makePayment } from "@/domain/business/bank/bank.service";

export const POST = withAuth(async (_request, { user, params }) => {
  const loan = await makePayment(user.id, params.id, params.loanId);
  return NextResponse.json(loan);
});
