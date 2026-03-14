import { prisma } from "@/lib/prisma";

const listingSelect = {
  id: true,
  businessId: true,
  business: { select: { name: true } },
  itemId: true,
  itemName: true,
  category: true,
  quantity: true,
  pricePerUnit: true,
  status: true,
  createdAt: true,
};

export async function addItem(data: {
  businessId: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  pricePerUnit: bigint;
}) {
  return prisma.dealershipListing.create({
    data,
    select: listingSelect,
  });
}

export async function findListingById(id: string) {
  return prisma.dealershipListing.findUnique({
    where: { id },
    select: { ...listingSelect, buyerId: true, recipientFarmId: true },
  });
}

export async function findInventory(businessId: string) {
  return prisma.dealershipListing.findMany({
    where: { businessId, status: "active" },
    select: listingSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePrice(id: string, pricePerUnit: bigint) {
  return prisma.dealershipListing.update({
    where: { id },
    data: { pricePerUnit },
    select: listingSelect,
  });
}

export async function removeItem(id: string) {
  return prisma.dealershipListing.update({
    where: { id },
    data: { status: "cancelled" },
    select: listingSelect,
  });
}

export async function purchaseItem(
  listingId: string,
  businessId: string,
  buyerId: string,
  recipientFarmId: string,
  gameServerId: string,
  totalPrice: bigint,
  itemId: string,
  farmSlot: number
) {
  return prisma.$transaction(async (tx) => {
    // 1) Debit buyer's wallet
    const buyerWallet = await tx.wallet.findUnique({
      where: { userId: buyerId },
      select: { id: true, balance: true },
    });
    if (!buyerWallet || buyerWallet.balance < totalPrice) {
      throw new Error("Insufficient funds");
    }

    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: { balance: { decrement: totalPrice } },
    });

    await tx.walletLedger.create({
      data: {
        walletId: buyerWallet.id,
        amount: -totalPrice,
        type: "purchase",
        referenceId: listingId,
        description: "Dealership purchase",
      },
    });

    // 2) Credit business wallet
    const bizWallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true },
    });
    if (!bizWallet) throw new Error("Business wallet not found");

    await tx.businessWallet.update({
      where: { id: bizWallet.id },
      data: { balance: { increment: totalPrice } },
    });

    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount: totalPrice,
        type: "dealership_sale",
        referenceId: listingId,
        description: "Dealership sale",
      },
    });

    // 3) Mark listing as sold
    const listing = await tx.dealershipListing.update({
      where: { id: listingId },
      data: {
        status: "sold",
        buyerId,
        recipientFarmId,
      },
      select: listingSelect,
    });

    // 4) Create bridge Transaction for delivery
    await tx.transaction.create({
      data: {
        type: "equipment",
        equipmentId: itemId,
        status: "pending",
        senderId: buyerId,
        recipientFarmId,
        gameServerId,
        farmSlot,
      },
    });

    return listing;
  });
}
