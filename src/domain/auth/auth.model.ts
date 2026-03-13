export interface User {
  id: string;
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  career: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface UserDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  career: string;
}

export interface DiscordUserInfo {
  id: string;
  username: string;
  avatar: string | null;
}

export interface AuthResult {
  user: UserDTO;
  sessionToken: string;
  expiresAt: Date;
}
