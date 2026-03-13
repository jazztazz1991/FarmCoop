import { z } from "zod";

export const createContractSchema = z.object({
  gameServerId: z.string().min(1),
  commodityId: z.string().min(1).max(50),
  commodityName: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  pricePerUnit: z.number().int().positive(),
  expiresAt: z.string().refine((s) => !isNaN(Date.parse(s)), {
    message: "Invalid date string",
  }),
});
