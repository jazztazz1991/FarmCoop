import type { AuthResult, DiscordUserInfo, UserDTO, User } from "./auth.model";
import * as authRepo from "./auth.repository";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    career: user.career,
  };
}

export async function handleDiscordLogin(
  discordUser: DiscordUserInfo
): Promise<AuthResult> {
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  const user = await authRepo.upsertUserByDiscordId(
    discordUser.id,
    discordUser.username,
    avatarUrl
  );

  const session = await authRepo.createSession(user.id);

  return {
    user: toUserDTO(user as User),
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function validateSession(
  token: string
): Promise<UserDTO | null> {
  const session = await authRepo.findSessionByToken(token);

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await authRepo.deleteSession(token);
    return null;
  }

  return toUserDTO(session.user as User);
}

export async function logout(token: string): Promise<void> {
  try {
    await authRepo.deleteSession(token);
  } catch {
    // Session may already be deleted or expired — no-op
  }
}
