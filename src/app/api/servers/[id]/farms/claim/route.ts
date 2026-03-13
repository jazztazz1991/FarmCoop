import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { claimFarm } from "@/domain/farm/farm.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId } = await params;

  try {
    const body = await request.json();
    const farm = await claimFarm(user.id, gameServerId, body);
    return NextResponse.json(farm, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid input";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
