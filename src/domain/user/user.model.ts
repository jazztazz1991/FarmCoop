export type Career = "farmer" | "trucker" | "dealer" | "inspector";

export interface UserDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  career: Career;
}

export interface UpdateProfileInput {
  displayName?: string;
  career?: Career;
}
