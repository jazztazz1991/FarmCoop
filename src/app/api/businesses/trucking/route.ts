import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { browseTruckingCompanies } from "@/domain/business/trucking/trucking.service";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId") ?? undefined;
  const companies = await browseTruckingCompanies(serverId);
  return NextResponse.json(companies);
});
