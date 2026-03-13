import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPremiumQuote } from "@/domain/insurance/insurance.service";

/** GET /api/insurance/premiums — get a premium quote */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const coverageAmount = searchParams.get("coverageAmount");
    const termDays = searchParams.get("termDays");

    if (!type || !coverageAmount || !termDays) {
      return NextResponse.json(
        { error: "Missing required query parameters: type, coverageAmount, termDays" },
        { status: 400 }
      );
    }

    const premium = getPremiumQuote(type, coverageAmount, Number(termDays));

    return NextResponse.json({ premium });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
