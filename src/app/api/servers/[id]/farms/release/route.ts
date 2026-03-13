import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { releaseFarm } from "@/domain/farm/farm.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // params.id here is the server ID, but we need the farm ID from body
  await params; // consume params

  try {
    const body = await request.json();
    const farmId = body.farmId;
    if (!farmId) {
      return NextResponse.json({ error: "farmId required" }, { status: 400 });
    }

    await releaseFarm(user.id, farmId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid input";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
