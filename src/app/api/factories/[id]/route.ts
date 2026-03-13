import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getFactory } from "@/domain/production/production.service";

/** GET /api/factories/[id] — get a single factory */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const factory = await getFactory(id);
  if (!factory) {
    return NextResponse.json({ error: "Factory not found" }, { status: 404 });
  }

  if (factory.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(factory);
}
