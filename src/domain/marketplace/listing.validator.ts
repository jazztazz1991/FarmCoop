import { z } from "zod";

export const createListingSchema = z.object({
  type: z.enum(["equipment", "commodity"]),
  itemId: z.string().min(1).max(500),
  itemName: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(9999),
  pricePerUnit: z.number().int().positive(),
});

export const searchListingsSchema = z.object({
  type: z.enum(["equipment", "commodity"]).optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});
