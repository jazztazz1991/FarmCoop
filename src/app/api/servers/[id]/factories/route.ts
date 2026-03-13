import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getMyFactories, createFactory } from "@/domain/production/production.service";

/** GET /api/servers/[id]/factories — list my factories filtered by server */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const factories = await getMyFactories(user.id);
  const filtered = factories.filter((f) => f.gameServerId === id);
  return NextResponse.json(filtered);
}

/** POST /api/servers/[id]/factories — create a new factory */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const factory = await createFactory(user.id, {
      ...body,
      gameServerId: id,
    });
    return NextResponse.json(factory, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
