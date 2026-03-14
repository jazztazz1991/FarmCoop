import { z } from "zod";

export const postDeliverySchema = z.object({
  destinationFarmId: z.string().min(1),
  itemDescription: z.string().min(1).max(200),
  payout: z.string().min(1).refine(
    (val) => { try { return BigInt(val) > 0n; } catch { return false; } },
    { message: "Payout must be a positive number" }
  ),
});
