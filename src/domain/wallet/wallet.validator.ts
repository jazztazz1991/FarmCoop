import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number().int().positive(),
  farmId: z.string().min(1), // Farm record ID from database
});

export const withdrawSchema = z.object({
  amount: z.number().int().positive(),
  farmId: z.string().min(1), // Farm record ID from database
});

export const transferSchema = z.object({
  toUserId: z.string().min(1),
  amount: z.number().int().positive(),
  description: z.string().max(200).optional(),
});
