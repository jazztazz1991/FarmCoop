import { prisma } from "@/lib/prisma";

const contractSelect = {
  id: true,
  gameServerId: true,
  posterId: true,
  poster: { select: { displayName: true } },
  claimerId: true,
  claimer: { select: { displayName: true } },
  commodityId: true,
  commodityName: true,
  quantity: true,
  pricePerUnit: true,
  totalPayout: true,
  status: true,
  expiresAt: true,
  deliveryDeadline: true,
  claimedAt: true,
  deliveredAt: true,
  completedAt: true,
  createdAt: true,
} as const;

/** Atomically create a contract and escrow funds from poster's wallet */
export async function createContractWithEscrow(data: {
  gameServerId: string;
  posterId: string;
  commodityId: string;
  commodityName: string;
  quantity: number;
  pricePerUnit: bigint;
  totalPayout: bigint;
  expiresAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    // Debit poster's wallet (escrow)
    const wallet = await tx.wallet.upsert({
      where: { userId: data.posterId },
      create: { userId: data.posterId },
      update: {},
      select: { id: true, balance: true },
    });

    const newBalance = wallet.balance - data.totalPayout;
    if (newBalance < 0n) {
      throw new Error("Insufficient balance");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    // Create ledger entry for escrow
    const contract = await tx.contract.create({
      data: {
        gameServerId: data.gameServerId,
        posterId: data.posterId,
        commodityId: data.commodityId,
        commodityName: data.commodityName,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalPayout: data.totalPayout,
        expiresAt: data.expiresAt,
      },
      select: contractSelect,
    });

    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -data.totalPayout,
        type: "contract_escrow",
        description: `Escrow for contract: ${data.commodityName} x${data.quantity}`,
        referenceId: contract.id,
      },
    });

    return contract;
  });
}

export async function findOpenContracts(gameServerId: string) {
  return prisma.contract.findMany({
    where: { gameServerId, status: "open" },
    select: contractSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    select: contractSelect,
  });
}

export async function findContractsByPoster(posterId: string) {
  return prisma.contract.findMany({
    where: { posterId },
    select: contractSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findContractsByClaimer(claimerId: string) {
  return prisma.contract.findMany({
    where: { claimerId },
    select: contractSelect,
    orderBy: { createdAt: "desc" },
  });
}

/** Claim a contract — set claimer and delivery deadline */
export async function claimContract(
  contractId: string,
  claimerId: string,
  deliveryDeadline: Date
) {
  return prisma.contract.update({
    where: { id: contractId },
    data: {
      claimerId,
      status: "claimed",
      claimedAt: new Date(),
      deliveryDeadline,
    },
    select: contractSelect,
  });
}

/** Mark contract as delivered (claimer confirms delivery) */
export async function markDelivered(contractId: string) {
  return prisma.contract.update({
    where: { id: contractId },
    data: {
      status: "delivered",
      deliveredAt: new Date(),
    },
    select: contractSelect,
  });
}

/** Atomically complete a contract — release escrow to claimer */
export async function completeContractWithPayout(
  contractId: string,
  claimerId: string,
  totalPayout: bigint,
  commodityName: string,
  quantity: number
) {
  return prisma.$transaction(async (tx) => {
    // Credit claimer's wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: claimerId },
      create: { userId: claimerId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + totalPayout },
    });

    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: totalPayout,
        type: "contract_payout",
        description: `Contract payout: ${commodityName} x${quantity}`,
        referenceId: contractId,
      },
    });

    // Mark contract as completed
    return tx.contract.update({
      where: { id: contractId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
      select: contractSelect,
    });
  });
}

/** Atomically cancel a contract — refund escrow to poster */
export async function cancelContractWithRefund(
  contractId: string,
  posterId: string,
  totalPayout: bigint,
  commodityName: string,
  quantity: number
) {
  return prisma.$transaction(async (tx) => {
    // Refund poster's wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: posterId },
      create: { userId: posterId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + totalPayout },
    });

    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: totalPayout,
        type: "contract_refund",
        description: `Contract refund: ${commodityName} x${quantity}`,
        referenceId: contractId,
      },
    });

    // Mark contract as cancelled
    return tx.contract.update({
      where: { id: contractId },
      data: { status: "cancelled" },
      select: contractSelect,
    });
  });
}

/** Expire contracts that are past their expiration date */
export async function expireContracts() {
  return prisma.contract.findMany({
    where: {
      status: "open",
      expiresAt: { lt: new Date() },
    },
    select: { id: true, posterId: true, totalPayout: true, commodityName: true, quantity: true },
  });
}
