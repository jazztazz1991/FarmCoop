import { prisma } from "@/lib/prisma";

export async function findOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true, userId: true, balance: true },
  });
}

export async function getBalance(userId: string) {
  const wallet = await findOrCreateWallet(userId);
  return wallet.balance;
}

export async function addLedgerEntry(
  userId: string,
  amount: bigint,
  type: string,
  description: string,
  referenceId?: string
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true, balance: true },
    });

    const newBalance = wallet.balance + amount;
    if (newBalance < 0n) {
      throw new Error("Insufficient balance");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    return tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount,
        type,
        description,
        referenceId,
      },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });
  });
}

export async function getLedgerEntries(userId: string, limit = 50) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!wallet) return [];

  return prisma.walletLedger.findMany({
    where: { walletId: wallet.id },
    select: {
      id: true,
      amount: true,
      type: true,
      description: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
