import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { withdrawCertificate } from "@/domain/banking/banking.service";

/** POST /api/banking/certificates/[id]/withdraw — withdraw CD */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: certId } = await params;

  try {
    const cert = await withdrawCertificate(certId, user.id);
    return NextResponse.json(cert);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
