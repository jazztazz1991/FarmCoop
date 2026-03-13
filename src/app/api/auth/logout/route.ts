import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import { logout } from "@/domain/auth/auth.service";

export async function POST(request: NextRequest) {
  const token = getSessionToken(request);

  if (token) {
    await logout(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
