import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { deposit } from "@/domain/wallet/wallet.service";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await deposit(user.id, body);
    return NextResponse.json({
      ...result,
      message: "Deposit initiated. Wallet will be credited once the game confirms the money was removed.",
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
