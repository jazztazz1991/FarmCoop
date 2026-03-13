import { prisma } from "@/lib/prisma";

const policySelect = {
  id: true,
  holderId: true,
  gameServerId: true,
  type: true,
  coverageAmount: true,
  premium: true,
  deductible: true,
  status: true,
  commodityId: true,
  commodityName: true,
  strikePrice: true,
  equipmentId: true,
  equipmentName: true,
  startsAt: true,
  expiresAt: true,
  createdAt: true,
} as const;

const claimSelect = {
  id: true,
  policyId: true,
  claimAmount: true,
  payout: true,
  reason: true,
  status: true,
  resolvedAt: true,
  createdAt: true,
} as const;

/** Atomically purchase a policy: debit wallet + create policy + ledger */
export async function purchasePolicy(data: {
  holderId: string;
  gameServerId: string;
  type: string;
  coverageAmount: bigint;
  premium: bigint;
  deductible: bigint;
  commodityId?: string;
  commodityName?: string;
  strikePrice?: bigint;
  equipmentId?: string;
  equipmentName?: string;
  expiresAt: Date;
}) {
  return prisma.$transaction(async (tx) => {
    // Debit wallet for premium
    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { userId: data.holderId },
      select: { id: true, balance: true },
    });

    if (wallet.balance < data.premium) {
      throw new Error("Insufficient balance for premium");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - data.premium },
    });

    // Create policy
    const policy = await tx.insurancePolicy.create({
      data: {
        holderId: data.holderId,
        gameServerId: data.gameServerId,
        type: data.type,
        coverageAmount: data.coverageAmount,
        premium: data.premium,
        deductible: data.deductible,
        commodityId: data.commodityId,
        commodityName: data.commodityName,
        strikePrice: data.strikePrice,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        expiresAt: data.expiresAt,
      },
      select: policySelect,
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: -data.premium,
        type: "insurance_premium",
        description: `Insurance premium: ${data.type} policy`,
        referenceId: policy.id,
      },
    });

    return policy;
  });
}

/** Atomically approve a claim: credit wallet + create claim record + ledger */
export async function approveClaim(data: {
  policyId: string;
  holderId: string;
  claimAmount: bigint;
  payout: bigint;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Credit wallet
    const wallet = await tx.wallet.upsert({
      where: { userId: data.holderId },
      create: { userId: data.holderId },
      update: {},
      select: { id: true, balance: true },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance + data.payout },
    });

    // Create claim
    const claim = await tx.insuranceClaim.create({
      data: {
        policyId: data.policyId,
        claimAmount: data.claimAmount,
        payout: data.payout,
        reason: data.reason,
        status: "approved",
        resolvedAt: new Date(),
      },
      select: claimSelect,
    });

    // Update policy status
    await tx.insurancePolicy.update({
      where: { id: data.policyId },
      data: { status: "claimed" },
    });

    // Ledger entry
    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        amount: data.payout,
        type: "insurance_payout",
        description: `Insurance payout: ${data.reason}`,
        referenceId: claim.id,
      },
    });

    return claim;
  });
}

/** Deny a claim */
export async function denyClaim(data: {
  policyId: string;
  claimAmount: bigint;
  reason: string;
}) {
  return prisma.insuranceClaim.create({
    data: {
      policyId: data.policyId,
      claimAmount: data.claimAmount,
      payout: 0n,
      reason: data.reason,
      status: "denied",
      resolvedAt: new Date(),
    },
    select: claimSelect,
  });
}

export async function findPoliciesByHolder(holderId: string) {
  return prisma.insurancePolicy.findMany({
    where: { holderId },
    select: policySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findPolicyById(id: string) {
  return prisma.insurancePolicy.findUnique({
    where: { id },
    select: policySelect,
  });
}

export async function findClaimsByHolder(holderId: string) {
  return prisma.insuranceClaim.findMany({
    where: { policy: { holderId } },
    select: claimSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findExpiredPolicies() {
  return prisma.insurancePolicy.findMany({
    where: {
      status: "active",
      expiresAt: { lte: new Date() },
    },
    select: policySelect,
  });
}

export async function expirePolicy(id: string) {
  return prisma.insurancePolicy.update({
    where: { id },
    data: { status: "expired" },
    select: policySelect,
  });
}
