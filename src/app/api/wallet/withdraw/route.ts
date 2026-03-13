import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { withdraw } from "@/domain/wallet/wallet.service";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const entry = await withdraw(user.id, body);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid input";
    const status = message === "Insufficient balance" ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
