import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfile, updateProfile, toDTO } from "../user.service";

vi.mock("../user.repository", () => ({
  findUserById: vi.fn(),
  updateUser: vi.fn(),
}));

import * as userRepo from "../user.repository";

const mockUser = {
  id: "user-1",
  displayName: "TestUser",
  avatarUrl: "https://example.com/avatar.png",
  role: "member",
  career: "farmer",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toDTO", () => {
  it("returns only allowlisted fields", () => {
    const dto = toDTO(mockUser);
    expect(dto).toEqual(mockUser);
  });
});

describe("getProfile", () => {
  it("returns user DTO", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(mockUser);

    const result = await getProfile("user-1");
    expect(result?.id).toBe("user-1");
    expect(result?.displayName).toBe("TestUser");
  });

  it("returns null for non-existent user", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    const result = await getProfile("nonexistent");
    expect(result).toBeNull();
  });
});

describe("updateProfile", () => {
  it("updates display name", async () => {
    vi.mocked(userRepo.updateUser).mockResolvedValue({
      ...mockUser,
      displayName: "NewName",
    });

    const result = await updateProfile("user-1", { displayName: "NewName" });
    expect(result.displayName).toBe("NewName");
    expect(userRepo.updateUser).toHaveBeenCalledWith("user-1", {
      displayName: "NewName",
    });
  });

  it("rejects empty display name", async () => {
    await expect(
      updateProfile("user-1", { displayName: "" })
    ).rejects.toThrow();
  });

  it("updates career", async () => {
    vi.mocked(userRepo.updateUser).mockResolvedValue({
      ...mockUser,
      career: "trucker",
    });

    const result = await updateProfile("user-1", { career: "trucker" });
    expect(result.career).toBe("trucker");
    expect(userRepo.updateUser).toHaveBeenCalledWith("user-1", {
      career: "trucker",
    });
  });

  it("rejects invalid career", async () => {
    await expect(
      updateProfile("user-1", { career: "pirate" as unknown as "farmer" })
    ).rejects.toThrow();
  });
});
