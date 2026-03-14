import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { browseDealerships } from "@/domain/business/dealership/dealership.service";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId") ?? undefined;
  const dealerships = await browseDealerships(serverId);
  return NextResponse.json(dealerships);
});
