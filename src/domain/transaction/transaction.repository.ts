import { prisma } from "@/lib/prisma";
import type {
  Transaction,
  TransactionStatus,
} from "./transaction.model";

const transactionSelect = {
  id: true,
  type: true,
  amount: true,
  equipmentId: true,
  status: true,
  senderId: true,
  recipientFarmId: true,
  gameServerId: true,
  farmSlot: true,
  createdAt: true,
  updatedAt: true,
  bridgePickedUpAt: true,
  deliveredAt: true,
  confirmedAt: true,
} as const;

export async function createTransaction(data: {
  type: string;
  senderId: string;
  recipientFarmId: string;
  gameServerId: string;
  farmSlot: number;
  amount?: number;
  equipmentId?: string;
}): Promise<Transaction> {
  return prisma.transaction.create({
    data: {
      type: data.type,
      senderId: data.senderId,
      recipientFarmId: data.recipientFarmId,
      gameServerId: data.gameServerId,
      farmSlot: data.farmSlot,
      amount: data.amount ?? null,
      equipmentId: data.equipmentId ?? null,
    },
    select: transactionSelect,
  }) as unknown as Promise<Transaction>;
}

export async function findTransactions(filter?: {
  status?: TransactionStatus;
}): Promise<Transaction[]> {
  return prisma.transaction.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { createdAt: "desc" },
    select: transactionSelect,
  }) as unknown as Promise<Transaction[]>;
}

export async function findTransactionById(
  id: string
): Promise<Transaction | null> {
  return prisma.transaction.findUnique({
    where: { id },
    select: transactionSelect,
  }) as unknown as Promise<Transaction | null>;
}

export async function findPendingWalletTransactions(
  userId: string
): Promise<Transaction[]> {
  return prisma.transaction.findMany({
    where: {
      senderId: userId,
      type: { in: ["wallet_deposit", "wallet_withdrawal"] },
      status: { in: ["pending", "delivered"] },
    },
    orderBy: { createdAt: "desc" },
    select: transactionSelect,
  }) as unknown as Promise<Transaction[]>;
}

export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<Transaction> {
  const timestamps: Record<string, Date> = {};
  if (status === "delivered") timestamps.deliveredAt = new Date();
  if (status === "confirmed") timestamps.confirmedAt = new Date();
  if (status === "delivered" || status === "confirmed") {
    timestamps.bridgePickedUpAt = new Date();
  }

  return prisma.transaction.update({
    where: { id },
    data: { status, ...timestamps },
    select: transactionSelect,
  }) as unknown as Promise<Transaction>;
}
