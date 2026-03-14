import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getMyBusinesses } from "@/domain/business/business.service";

export const GET = withAuth(async (_request, { user }) => {
  const businesses = await getMyBusinesses(user.id);
  return NextResponse.json(businesses);
});
