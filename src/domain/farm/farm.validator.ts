import { z } from "zod";

export const claimFarmSchema = z.object({
  farmSlot: z.number().int().min(1).max(16),
  name: z.string().min(1).max(50),
});
