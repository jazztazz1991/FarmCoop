import { z } from "zod";

export const purchasePolicySchema = z.object({
  gameServerId: z.string().min(1),
  type: z.enum(["crop", "vehicle", "liability"]),
  coverageAmount: z.string().min(1).refine((v) => {
    try { return BigInt(v) > 0n; } catch { return false; }
  }, "Coverage must be a positive number"),
  termDays: z.number().int().min(1).max(365),
  deductible: z.string().optional().default("0"),
  // Crop-specific
  commodityId: z.string().optional(),
  commodityName: z.string().optional(),
  strikePrice: z.string().optional(),
  // Vehicle-specific
  equipmentId: z.string().optional(),
  equipmentName: z.string().optional(),
}).refine((data) => {
  if (data.type === "crop") {
    return data.commodityId && data.commodityName && data.strikePrice;
  }
  return true;
}, "Crop insurance requires commodityId, commodityName, and strikePrice")
.refine((data) => {
  if (data.type === "vehicle") {
    return data.equipmentId && data.equipmentName;
  }
  return true;
}, "Vehicle insurance requires equipmentId and equipmentName");

export const fileClaimSchema = z.object({
  policyId: z.string().min(1),
  claimAmount: z.string().min(1).refine((v) => {
    try { return BigInt(v) > 0n; } catch { return false; }
  }, "Claim amount must be a positive number"),
  reason: z.string().min(1).max(500),
});
