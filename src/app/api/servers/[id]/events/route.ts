import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getActiveEvents, getUpcomingEvents, getAllEvents, createEvent } from "@/domain/event/event.service";
import { ZodError } from "zod";

/** GET /api/servers/[id]/events?view=active|upcoming|all */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId } = await params;
  const view = request.nextUrl.searchParams.get("view") ?? "active";

  switch (view) {
    case "upcoming":
      return NextResponse.json(await getUpcomingEvents(gameServerId));
    case "all":
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(await getAllEvents(gameServerId));
    default:
      return NextResponse.json(await getActiveEvents(gameServerId));
  }
}

/** POST /api/servers/[id]/events — create event (admin only) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: gameServerId } = await params;

  try {
    const body = await request.json();
    const event = await createEvent({ ...body, gameServerId });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
