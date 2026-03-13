import { z } from "zod";

export const setBasePriceSchema = z.object({
  commodityId: z.string().min(1).max(50),
  commodityName: z.string().min(1).max(100),
  basePrice: z.number().int().positive(),
});

export const priceQuerySchema = z.object({
  commodityId: z.string().min(1).optional(),
});
