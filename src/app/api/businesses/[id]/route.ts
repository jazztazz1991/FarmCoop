import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import {
  getBusiness,
  updateBusinessSettings,
  closeBusiness,
} from "@/domain/business/business.service";

export const GET = withAuth(async (_request, { params }) => {
  const business = await getBusiness(params.id);
  return NextResponse.json(business);
});

export const PATCH = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const business = await updateBusinessSettings(user.id, params.id, body);
  return NextResponse.json(business);
});

export const DELETE = withAuth(async (_request, { user, params }) => {
  const business = await closeBusiness(user.id, params.id);
  return NextResponse.json(business);
});
