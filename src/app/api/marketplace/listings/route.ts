import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createListing, searchListings } from "@/domain/marketplace/listing.service";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const options = {
    type: url.searchParams.get("type") || undefined,
    search: url.searchParams.get("search") || undefined,
    limit: url.searchParams.has("limit")
      ? Number(url.searchParams.get("limit"))
      : undefined,
    offset: url.searchParams.has("offset")
      ? Number(url.searchParams.get("offset"))
      : undefined,
  };

  try {
    const listings = await searchListings(options);
    return NextResponse.json(listings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const listing = await createListing(user.id, body);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
