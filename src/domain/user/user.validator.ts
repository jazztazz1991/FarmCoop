import { z } from "zod";

export const VALID_CAREERS = ["farmer", "trucker", "dealer", "inspector"] as const;

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(32).optional(),
  career: z.enum(VALID_CAREERS).optional(),
});
