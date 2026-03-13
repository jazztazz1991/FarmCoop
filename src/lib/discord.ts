import type { DiscordUserInfo } from "@/domain/auth/auth.model";

const DISCORD_API = "https://discord.com/api/v10";

export function getDiscordAuthUrl(redirectUri: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) throw new Error("DISCORD_CLIENT_ID not set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
  });

  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not set");
  }

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function fetchDiscordUser(
  accessToken: string
): Promise<DiscordUserInfo> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Discord user fetch failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    username: data.username,
    avatar: data.avatar,
  };
}
