import { z } from "zod";

export const createTransactionSchema = z
  .object({
    type: z.enum(["money", "equipment", "wallet_deposit", "wallet_withdrawal"]),
    senderId: z.string().min(1),
    recipientFarmId: z.string().min(1),
    gameServerId: z.string().min(1),
    farmSlot: z.number().int().min(1).max(16),
    amount: z.number().int().positive().optional(),
    equipmentId: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "money" || data.type === "wallet_deposit" || data.type === "wallet_withdrawal") return data.amount !== undefined;
      return true;
    },
    { message: "amount is required for money/wallet transactions", path: ["amount"] }
  )
  .refine(
    (data) => {
      if (data.type === "equipment") return data.equipmentId !== undefined;
      return true;
    },
    {
      message: "equipmentId is required for equipment transactions",
      path: ["equipmentId"],
    }
  );

const validStatusTransitions: Record<string, string[]> = {
  pending: ["delivered", "failed"],
  delivered: ["confirmed", "failed"],
  confirmed: [],
  failed: [],
};

export const updateStatusSchema = z.object({
  status: z.enum(["delivered", "confirmed", "failed"]),
});

export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowed = validStatusTransitions[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}
