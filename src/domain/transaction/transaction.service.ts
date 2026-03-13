import type {
  CreateTransactionInput,
  Transaction,
  TransactionDTO,
  TransactionStatus,
} from "./transaction.model";
import {
  createTransactionSchema,
  isValidStatusTransition,
  updateStatusSchema,
} from "./transaction.validator";
import * as repo from "./transaction.repository";

export function toDTO(tx: Transaction): TransactionDTO {
  return {
    id: tx.id,
    type: tx.type,
    farmId: tx.farmSlot, // bridge/mod use farmId = the in-game farm slot
    gameServerId: tx.gameServerId,
    amount: tx.amount,
    equipmentId: tx.equipmentId,
    status: tx.status,
    senderId: tx.senderId,
    createdAt: tx.createdAt.toISOString(),
  };
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<TransactionDTO> {
  const parsed = createTransactionSchema.parse(input);
  const tx = await repo.createTransaction({
    type: parsed.type,
    senderId: parsed.senderId,
    recipientFarmId: parsed.recipientFarmId,
    gameServerId: parsed.gameServerId,
    farmSlot: parsed.farmSlot,
    amount: parsed.amount,
    equipmentId: parsed.equipmentId,
  });
  return toDTO(tx);
}

export async function listTransactions(
  status?: TransactionStatus
): Promise<TransactionDTO[]> {
  const transactions = await repo.findTransactions(
    status ? { status } : undefined
  );
  return transactions.map(toDTO);
}

export async function updateStatus(
  id: string,
  newStatus: string
): Promise<TransactionDTO> {
  const { status } = updateStatusSchema.parse({ status: newStatus });

  const existing = await repo.findTransactionById(id);
  if (!existing) {
    throw new Error("Transaction not found");
  }

  if (!isValidStatusTransition(existing.status, status)) {
    throw new Error(
      `Invalid status transition from ${existing.status} to ${status}`
    );
  }

  const updated = await repo.updateTransactionStatus(id, status);
  return toDTO(updated);
}
