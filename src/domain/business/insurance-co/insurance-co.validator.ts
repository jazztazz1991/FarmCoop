import { z } from "zod";

const bigIntString = z.string().min(1).refine(
  (val) => { try { return BigInt(val) > 0n; } catch { return false; } },
  { message: "Must be a positive number" }
);

export const purchasePolicySchema = z.object({
  type: z.enum(["crop", "vehicle", "liability"]),
  coverageAmount: bigIntString,
  termDays: z.number().int().min(1).max(365),
  commodityId: z.string().optional(),
  commodityName: z.string().optional(),
  equipmentId: z.string().optional(),
  equipmentName: z.string().optional(),
});

export const fileClaimSchema = z.object({
  claimAmount: bigIntString,
  reason: z.string().min(1).max(500),
});

export const reviewClaimSchema = z.object({
  decision: z.enum(["approve", "deny"]),
  payout: z.string().optional(),
});
