import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import {
  createBusiness,
  browseBusinesses,
} from "@/domain/business/business.service";
import type { BusinessType } from "@/domain/business/business.model";

export const POST = withAuth(async (request, { user }) => {
  const body = await request.json();
  const business = await createBusiness(user.id, user.career, body);
  return NextResponse.json(business, { status: 201 });
});

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as BusinessType | null;
  const gameServerId = searchParams.get("serverId") ?? undefined;

  const businesses = await browseBusinesses({
    ...(type ? { type } : {}),
    ...(gameServerId ? { gameServerId } : {}),
  });
  return NextResponse.json(businesses);
});
