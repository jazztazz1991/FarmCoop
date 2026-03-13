import { z } from "zod";

export const createFactorySchema = z.object({
  gameServerId: z.string().min(1),
  recipeId: z.string().min(1),
  name: z.string().min(1).max(100),
});

export const startProductionSchema = z.object({
  cycles: z.number().int().min(1).max(10),
});
