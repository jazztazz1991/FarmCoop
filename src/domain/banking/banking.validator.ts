import { z } from "zod";

export const applyForLoanSchema = z.object({
  gameServerId: z.string().min(1),
  principal: z.string().min(1).refine((v) => {
    try { return BigInt(v) > 0n; } catch { return false; }
  }, "Principal must be a positive number"),
  termMonths: z.number().int().min(1).max(60),
});

export const depositSavingsSchema = z.object({
  gameServerId: z.string().min(1),
  amount: z.string().min(1).refine((v) => {
    try { return BigInt(v) > 0n; } catch { return false; }
  }, "Amount must be a positive number"),
});

export const withdrawSavingsSchema = z.object({
  gameServerId: z.string().min(1),
  amount: z.string().min(1).refine((v) => {
    try { return BigInt(v) > 0n; } catch { return false; }
  }, "Amount must be a positive number"),
});

export const openCertificateSchema = z.object({
  gameServerId: z.string().min(1),
  principal: z.string().min(1).refine((v) => {
    try { return BigInt(v) > 0n; } catch { return false; }
  }, "Principal must be a positive number"),
  termDays: z.number().int().refine((v) => [30, 90, 180].includes(v), "Term must be 30, 90, or 180 days"),
});

export const LOAN_INTEREST_RATE_BP = 500; // 5.00% APR
export const SAVINGS_APY_BP = 200;        // 2.00% APY
export const CD_RATES: Record<number, number> = {
  30: 300,   // 3.00%
  90: 400,   // 4.00%
  180: 500,  // 5.00%
};
