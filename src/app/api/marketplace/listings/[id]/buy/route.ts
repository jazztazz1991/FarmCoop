import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { buyListing } from "@/domain/marketplace/listing.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const listing = await buyListing(user.id, id);
    return NextResponse.json(listing);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed";
    const status =
      message === "Listing not found" ? 404 :
      message === "Insufficient balance" ? 402 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
