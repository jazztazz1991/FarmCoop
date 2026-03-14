import { prisma } from "@/lib/prisma";

const contractSelect = {
  id: true,
  businessId: true,
  business: { select: { name: true } },
  posterId: true,
  poster: { select: { displayName: true } },
  gameServerId: true,
  destinationFarm: { select: { name: true, farmSlot: true, gameServer: { select: { name: true } } } },
  itemDescription: true,
  payout: true,
  status: true,
  acceptedAt: true,
  deliveredAt: true,
  completedAt: true,
  createdAt: true,
};

export async function createDelivery(
  businessId: string,
  posterId: string,
  gameServerId: string,
  destinationFarmId: string,
  itemDescription: string,
  payout: bigint
) {
  return prisma.$transaction(async (tx) => {
    // 1) Escrow from poster's wallet
    const posterWallet = await tx.wallet.findUnique({
      where: { userId: posterId },
      select: { id: true, balance: true },
    });
    if (!posterWallet || posterWallet.balance < payout) {
      throw new Error("Insufficient funds for escrow");
    }

    await tx.wallet.update({
      where: { id: posterWallet.id },
      data: { balance: { decrement: payout } },
    });

    await tx.walletLedger.create({
      data: {
        walletId: posterWallet.id,
        amount: -payout,
        type: "contract_escrow",
        description: "Delivery contract escrow",
      },
    });

    // 2) Create delivery contract
    return tx.deliveryContract.create({
      data: {
        businessId,
        posterId,
        gameServerId,
        destinationFarmId,
        itemDescription,
        payout,
      },
      select: contractSelect,
    });
  });
}

export async function findDeliveriesByBusiness(businessId: string) {
  return prisma.deliveryContract.findMany({
    where: { businessId },
    select: contractSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findDeliveriesByPoster(businessId: string, posterId: string) {
  return prisma.deliveryContract.findMany({
    where: { businessId, posterId },
    select: contractSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findDeliveryById(id: string) {
  return prisma.deliveryContract.findUnique({
    where: { id },
    select: contractSelect,
  });
}

export async function acceptDelivery(id: string) {
  return prisma.deliveryContract.update({
    where: { id },
    data: { status: "accepted", acceptedAt: new Date() },
    select: contractSelect,
  });
}

export async function markDelivered(id: string) {
  return prisma.deliveryContract.update({
    where: { id },
    data: { status: "delivered", deliveredAt: new Date() },
    select: contractSelect,
  });
}

export async function confirmDelivery(id: string, businessId: string, payout: bigint) {
  return prisma.$transaction(async (tx) => {
    // Release escrow to business wallet
    const bizWallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true },
    });
    if (!bizWallet) throw new Error("Business wallet not found");

    await tx.businessWallet.update({
      where: { id: bizWallet.id },
      data: { balance: { increment: payout } },
    });

    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount: payout,
        type: "delivery_payout",
        referenceId: id,
        description: "Delivery payout received",
      },
    });

    return tx.deliveryContract.update({
      where: { id },
      data: { status: "completed", completedAt: new Date() },
      select: contractSelect,
    });
  });
}

export async function cancelDelivery(id: string, posterId: string, payout: bigint) {
  return prisma.$transaction(async (tx) => {
    // Refund escrow to poster
    const posterWallet = await tx.wallet.findUnique({
      where: { userId: posterId },
      select: { id: true },
    });
    if (posterWallet) {
      await tx.wallet.update({
        where: { id: posterWallet.id },
        data: { balance: { increment: payout } },
      });

      await tx.walletLedger.create({
        data: {
          walletId: posterWallet.id,
          amount: payout,
          type: "contract_refund",
          description: "Delivery contract refund",
        },
      });
    }

    return tx.deliveryContract.update({
      where: { id },
      data: { status: "cancelled" },
      select: contractSelect,
    });
  });
}
