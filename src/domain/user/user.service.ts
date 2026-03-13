import type { UserDTO, UpdateProfileInput } from "./user.model";
import { updateProfileSchema } from "./user.validator";
import * as userRepo from "./user.repository";

export function toDTO(user: { id: string; displayName: string; avatarUrl: string | null; role: string; career: string }): UserDTO {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    career: user.career as UserDTO["career"],
  };
}

export async function getProfile(userId: string): Promise<UserDTO | null> {
  const user = await userRepo.findUserById(userId);
  if (!user) return null;
  return toDTO(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserDTO> {
  const parsed = updateProfileSchema.parse(input);
  const user = await userRepo.updateUser(userId, parsed);
  return toDTO(user);
}
