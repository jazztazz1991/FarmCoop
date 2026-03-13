import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { accrueInterest, matureCertificates } from "@/domain/banking/banking.service";

/** POST /api/banking/accrue — cron: accrue savings interest + mature CDs */
export async function POST(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [savingsCount, cdCount] = await Promise.all([
    accrueInterest(),
    matureCertificates(),
  ]);

  return NextResponse.json({
    savingsAccrued: savingsCount,
    certificatesMatured: cdCount,
  });
}
