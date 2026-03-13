import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleDiscordLogin, validateSession, logout, toUserDTO } from "../auth.service";
import type { User, DiscordUserInfo } from "../auth.model";

vi.mock("../auth.repository", () => ({
  upsertUserByDiscordId: vi.fn(),
  createSession: vi.fn(),
  findSessionByToken: vi.fn(),
  deleteSession: vi.fn(),
}));

import * as authRepo from "../auth.repository";

const mockUser: User = {
  id: "user-1",
  discordId: "123456789",
  displayName: "TestUser",
  avatarUrl: "https://cdn.discordapp.com/avatars/123456789/abc.png",
  role: "member",
  career: "farmer",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockSession = {
  id: "session-1",
  userId: "user-1",
  token: "abc123token",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toUserDTO", () => {
  it("returns only allowlisted fields", () => {
    const dto = toUserDTO(mockUser);
    expect(dto).toEqual({
      id: "user-1",
      displayName: "TestUser",
      avatarUrl: "https://cdn.discordapp.com/avatars/123456789/abc.png",
      role: "member",
      career: "farmer",
    });
    expect(dto).not.toHaveProperty("discordId");
    expect(dto).not.toHaveProperty("createdAt");
    expect(dto).not.toHaveProperty("updatedAt");
  });
});

describe("handleDiscordLogin", () => {
  it("creates or updates user and returns auth result", async () => {
    vi.mocked(authRepo.upsertUserByDiscordId).mockResolvedValue(mockUser);
    vi.mocked(authRepo.createSession).mockResolvedValue(mockSession);

    const discordUser: DiscordUserInfo = {
      id: "123456789",
      username: "TestUser",
      avatar: "abc",
    };

    const result = await handleDiscordLogin(discordUser);

    expect(authRepo.upsertUserByDiscordId).toHaveBeenCalledWith(
      "123456789",
      "TestUser",
      "https://cdn.discordapp.com/avatars/123456789/abc.png"
    );
    expect(authRepo.createSession).toHaveBeenCalledWith("user-1");
    expect(result.user.id).toBe("user-1");
    expect(result.sessionToken).toBe("abc123token");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("handles null avatar", async () => {
    vi.mocked(authRepo.upsertUserByDiscordId).mockResolvedValue({
      ...mockUser,
      avatarUrl: null,
    });
    vi.mocked(authRepo.createSession).mockResolvedValue(mockSession);

    const discordUser: DiscordUserInfo = {
      id: "123456789",
      username: "TestUser",
      avatar: null,
    };

    const result = await handleDiscordLogin(discordUser);

    expect(authRepo.upsertUserByDiscordId).toHaveBeenCalledWith(
      "123456789",
      "TestUser",
      null
    );
    expect(result.user.avatarUrl).toBeNull();
  });
});

describe("validateSession", () => {
  it("returns user DTO for valid session", async () => {
    vi.mocked(authRepo.findSessionByToken).mockResolvedValue({
      ...mockSession,
      user: mockUser,
    });

    const result = await validateSession("abc123token");

    expect(result).toEqual({
      id: "user-1",
      displayName: "TestUser",
      avatarUrl: "https://cdn.discordapp.com/avatars/123456789/abc.png",
      role: "member",
      career: "farmer",
    });
  });

  it("returns null for non-existent session", async () => {
    vi.mocked(authRepo.findSessionByToken).mockResolvedValue(null);

    const result = await validateSession("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null and deletes expired session", async () => {
    vi.mocked(authRepo.findSessionByToken).mockResolvedValue({
      ...mockSession,
      expiresAt: new Date("2020-01-01"),
      user: mockUser,
    });
    vi.mocked(authRepo.deleteSession).mockResolvedValue({} as never);

    const result = await validateSession("abc123token");

    expect(result).toBeNull();
    expect(authRepo.deleteSession).toHaveBeenCalledWith("abc123token");
  });
});

describe("logout", () => {
  it("deletes the session", async () => {
    vi.mocked(authRepo.deleteSession).mockResolvedValue({} as never);

    await logout("abc123token");
    expect(authRepo.deleteSession).toHaveBeenCalledWith("abc123token");
  });

  it("does not throw if session does not exist", async () => {
    vi.mocked(authRepo.deleteSession).mockRejectedValue(new Error("Not found"));

    await expect(logout("nonexistent")).resolves.not.toThrow();
  });
});
