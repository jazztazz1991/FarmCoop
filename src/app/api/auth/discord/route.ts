import { NextRequest, NextResponse } from "next/server";
import { getDiscordAuthUrl } from "@/lib/discord";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/discord/callback`;

  try {
    const authUrl = getDiscordAuthUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.json(
      { error: "Discord OAuth not configured" },
      { status: 500 }
    );
  }
}
