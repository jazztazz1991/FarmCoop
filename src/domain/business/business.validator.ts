import { z } from "zod";

export const createBusinessSchema = z.object({
  gameServerId: z.string().min(1),
  type: z.enum(["bank", "dealership", "insurance", "trucking"]),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional().default(""),
});

export const updateBusinessSettingsSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const walletTransferSchema = z.object({
  amount: z.string().min(1).refine(
    (val) => {
      try {
        return BigInt(val) > 0n;
      } catch {
        return false;
      }
    },
    { message: "Amount must be a positive number" }
  ),
});
