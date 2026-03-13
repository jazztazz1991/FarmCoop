import { z } from "zod";

export const createEventSchema = z.object({
  gameServerId: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(["bonus_payout", "double_prices", "harvest_rush", "custom"]),
  multiplier: z.number().min(0.1).max(10),
  startsAt: z.string().refine((s) => !isNaN(Date.parse(s)), {
    message: "Invalid date string",
  }),
  endsAt: z.string().refine((s) => !isNaN(Date.parse(s)), {
    message: "Invalid date string",
  }),
});
