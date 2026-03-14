import { z } from "zod";

export const applyForLoanSchema = z.object({
  principal: z.string().min(1).refine(
    (val) => {
      try {
        return BigInt(val) > 0n;
      } catch {
        return false;
      }
    },
    { message: "Principal must be a positive number" }
  ),
  termMonths: z.number().int().min(1).max(60),
});

export const reviewApplicationSchema = z.object({
  decision: z.enum(["approve", "deny"]),
  denialReason: z.string().max(200).optional(),
});
