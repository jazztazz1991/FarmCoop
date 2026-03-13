import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { collectOutput } from "@/domain/production/production.service";

/** POST /api/factories/[id]/collect — collect output from a completed order */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: _factoryId } = await params;
    const body = await request.json();
    const order = await collectOutput(body.orderId, user.id);
    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
