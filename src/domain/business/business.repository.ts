import { prisma } from "@/lib/prisma";
import type { BusinessType } from "./business.model";

export async function createBusiness(data: {
  ownerId: string;
  gameServerId: string;
  type: string;
  name: string;
  description: string;
}) {
  return prisma.business.create({
    data: {
      ...data,
      wallet: { create: {} },
    },
    select: {
      id: true,
      ownerId: true,
      gameServerId: true,
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
      owner: { select: { displayName: true } },
      gameServer: { select: { name: true } },
    },
  });
}

export async function findBusinessById(id: string) {
  return prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      gameServerId: true,
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
      owner: { select: { displayName: true } },
      gameServer: { select: { name: true } },
    },
  });
}

export async function findBusinessesByOwner(ownerId: string) {
  return prisma.business.findMany({
    where: { ownerId, status: { not: "closed" } },
    select: {
      id: true,
      ownerId: true,
      gameServerId: true,
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
      owner: { select: { displayName: true } },
      gameServer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findBusinesses(filters: {
  type?: BusinessType;
  gameServerId?: string;
}) {
  return prisma.business.findMany({
    where: {
      status: "active",
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.gameServerId ? { gameServerId: filters.gameServerId } : {}),
    },
    select: {
      id: true,
      ownerId: true,
      gameServerId: true,
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
      owner: { select: { displayName: true } },
      gameServer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBusiness(
  id: string,
  data: { name?: string; description?: string; settings?: unknown; status?: string }
) {
  return prisma.business.update({
    where: { id },
    data: data as Record<string, unknown>,
    select: {
      id: true,
      ownerId: true,
      gameServerId: true,
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
      owner: { select: { displayName: true } },
      gameServer: { select: { name: true } },
    },
  });
}

export async function findExistingBusiness(
  ownerId: string,
  gameServerId: string,
  type: string
) {
  return prisma.business.findUnique({
    where: {
      ownerId_gameServerId_type: { ownerId, gameServerId, type },
    },
    select: { id: true },
  });
}

export async function getBusinessWallet(businessId: string) {
  return prisma.businessWallet.findUnique({
    where: { businessId },
    select: { balance: true },
  });
}

export async function getBusinessLedger(businessId: string, limit = 20) {
  const wallet = await prisma.businessWallet.findUnique({
    where: { businessId },
    select: { id: true },
  });
  if (!wallet) return [];

  return prisma.businessLedger.findMany({
    where: { businessWalletId: wallet.id },
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

export async function depositToBusinessWallet(
  businessId: string,
  userId: string,
  amount: bigint
) {
  return prisma.$transaction(async (tx) => {
    // Debit personal wallet
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true },
    });
    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient personal wallet balance");
    }
    await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: "business_wallet_deposit",
        description: "Deposit to business wallet",
      },
    });

    // Credit business wallet
    const bizWallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true },
    });
    if (!bizWallet) throw new Error("Business wallet not found");

    await tx.businessWallet.update({
      where: { businessId },
      data: { balance: { increment: amount } },
    });
    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount,
        type: "owner_deposit",
        description: "Owner deposit from personal wallet",
      },
    });
  });
}

export async function withdrawFromBusinessWallet(
  businessId: string,
  userId: string,
  amount: bigint
) {
  return prisma.$transaction(async (tx) => {
    // Debit business wallet
    const bizWallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true, balance: true },
    });
    if (!bizWallet || bizWallet.balance < amount) {
      throw new Error("Insufficient business wallet balance");
    }
    await tx.businessWallet.update({
      where: { businessId },
      data: { balance: { decrement: amount } },
    });
    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount: -amount,
        type: "owner_withdrawal",
        description: "Owner withdrawal to personal wallet",
      },
    });

    // Credit personal wallet
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) throw new Error("Personal wallet not found");

    await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "business_wallet_withdrawal",
        description: "Withdrawal from business wallet",
      },
    });
  });
}
