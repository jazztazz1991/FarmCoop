import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { findPendingWalletTransactions } from "@/domain/transaction/transaction.repository";
import { toDTO } from "@/domain/transaction/transaction.service";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await findPendingWalletTransactions(user.id);
  return NextResponse.json(transactions.map(toDTO));
}
