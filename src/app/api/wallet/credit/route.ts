import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { creditDepositOnConfirmation } from "@/domain/wallet/wallet.service";

/**
 * Bridge-only endpoint: credits a user's wallet after a wallet_deposit
 * transaction is confirmed by the game.
 */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, transactionId, amount } = await request.json();

    if (!userId || !transactionId || !amount) {
      return NextResponse.json(
        { error: "Missing userId, transactionId, or amount" },
        { status: 400 }
      );
    }

    await creditDepositOnConfirmation(userId, transactionId, amount);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to credit wallet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
