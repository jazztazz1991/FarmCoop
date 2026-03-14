import { z } from "zod";

export const addInventorySchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1).max(100),
  category: z.enum(["equipment", "commodity"]),
  quantity: z.number().int().min(1),
  pricePerUnit: z.string().min(1).refine(
    (val) => {
      try { return BigInt(val) > 0n; } catch { return false; }
    },
    { message: "Price must be a positive number" }
  ),
});

export const updatePriceSchema = z.object({
  pricePerUnit: z.string().min(1).refine(
    (val) => {
      try { return BigInt(val) > 0n; } catch { return false; }
    },
    { message: "Price must be a positive number" }
  ),
});

export const purchaseSchema = z.object({
  recipientFarmId: z.string().min(1),
});
