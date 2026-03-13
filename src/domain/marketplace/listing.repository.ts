import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const listingSelect = {
  id: true,
  sellerId: true,
  buyerId: true,
  type: true,
  itemId: true,
  itemName: true,
  quantity: true,
  pricePerUnit: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  seller: {
    select: { displayName: true },
  },
} as const;

export async function createListing(data: {
  sellerId: string;
  type: string;
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: bigint;
}) {
  return prisma.listing.create({
    data,
    select: listingSelect,
  });
}

export async function findActiveListings(options?: {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.ListingWhereInput = { status: "active" };

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.search) {
    where.itemName = { contains: options.search, mode: "insensitive" };
  }

  return prisma.listing.findMany({
    where,
    select: listingSelect,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function findListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    select: listingSelect,
  });
}

export async function findListingsBySeller(sellerId: string) {
  return prisma.listing.findMany({
    where: { sellerId },
    select: listingSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateListingStatus(
  id: string,
  status: string,
  buyerId?: string
) {
  return prisma.listing.update({
    where: { id },
    data: { status, ...(buyerId ? { buyerId } : {}) },
    select: listingSelect,
  });
}

/**
 * Atomic buy: debit buyer, credit seller, mark listing as sold — all in one transaction.
 * If any step fails (e.g. insufficient balance), the entire operation rolls back.
 */
export async function atomicBuyListing(
  listingId: string,
  buyerId: string,
  sellerId: string,
  totalPrice: bigint,
  itemName: string,
  quantity: number
) {
  return prisma.$transaction(async (tx) => {
    // Debit buyer wallet
    const buyerWallet = await tx.wallet.upsert({
      where: { userId: buyerId },
      create: { userId: buyerId },
      update: {},
      select: { id: true, balance: true },
    });

    const buyerNewBalance = buyerWallet.balance - totalPrice;
    if (buyerNewBalance < 0n) {
      throw new Error("Insufficient balance");
    }

    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: { balance: buyerNewBalance },
    });

    await tx.walletLedger.create({
      data: {
        walletId: buyerWallet.id,
        amount: -totalPrice,
        type: "purchase",
        description: `Purchased ${itemName} x${quantity}`,
        referenceId: listingId,
      },
    });

    // Credit seller wallet
    const sellerWallet = await tx.wallet.upsert({
      where: { userId: sellerId },
      create: { userId: sellerId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: { balance: sellerWallet.balance + totalPrice },
    });

    await tx.walletLedger.create({
      data: {
        walletId: sellerWallet.id,
        amount: totalPrice,
        type: "sale",
        description: `Sold ${itemName} x${quantity}`,
        referenceId: listingId,
      },
    });

    // Mark listing as sold
    return tx.listing.update({
      where: { id: listingId },
      data: { status: "sold", buyerId },
      select: listingSelect,
    });
  });
}

export async function expireListings() {
  return prisma.listing.updateMany({
    where: {
      status: "active",
      expiresAt: { lte: new Date() },
    },
    data: { status: "expired" },
  });
}
