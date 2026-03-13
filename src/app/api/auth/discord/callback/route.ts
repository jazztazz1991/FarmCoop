import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { exchangeCodeForToken, fetchDiscordUser } from "@/lib/discord";
import { handleDiscordLogin } from "@/domain/auth/auth.service";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/discord/callback`;

    const accessToken = await exchangeCodeForToken(code, redirectUri);
    const discordUser = await fetchDiscordUser(accessToken);
    const authResult = await handleDiscordLogin(discordUser);

    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    response.cookies.set("session", authResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: authResult.expiresAt,
    });

    // CSRF double-submit cookie — readable by JS so the fetch wrapper can attach it
    response.cookies.set("csrf-token", crypto.randomBytes(32).toString("hex"), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: authResult.expiresAt,
    });

    return response;
  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }
}
