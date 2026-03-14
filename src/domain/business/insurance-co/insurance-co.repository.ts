import { prisma } from "@/lib/prisma";

const policySelect = {
  id: true,
  businessId: true,
  business: { select: { name: true } },
  holderId: true,
  holder: { select: { displayName: true } },
  type: true,
  coverageAmount: true,
  premium: true,
  deductible: true,
  status: true,
  commodityId: true,
  commodityName: true,
  equipmentId: true,
  equipmentName: true,
  startsAt: true,
  expiresAt: true,
  createdAt: true,
};

const claimSelect = {
  id: true,
  businessId: true,
  policyId: true,
  claimAmount: true,
  payout: true,
  reason: true,
  status: true,
  resolvedAt: true,
  createdAt: true,
};

export async function createPolicy(
  businessId: string,
  holderId: string,
  gameServerId: string,
  premium: bigint,
  data: {
    type: string;
    coverageAmount: bigint;
    deductible: bigint;
    termDays: number;
    commodityId?: string;
    commodityName?: string;
    equipmentId?: string;
    equipmentName?: string;
  }
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.termDays);

  return prisma.$transaction(async (tx) => {
    // 1) Debit holder's wallet for premium
    const holderWallet = await tx.wallet.findUnique({
      where: { userId: holderId },
      select: { id: true, balance: true },
    });
    if (!holderWallet || holderWallet.balance < premium) {
      throw new Error("Insufficient funds for premium");
    }

    await tx.wallet.update({
      where: { id: holderWallet.id },
      data: { balance: { decrement: premium } },
    });

    await tx.walletLedger.create({
      data: {
        walletId: holderWallet.id,
        amount: -premium,
        type: "insurance_premium",
        description: "Business insurance premium",
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
      data: { balance: { increment: premium } },
    });

    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount: premium,
        type: "premium_income",
        description: "Premium received",
      },
    });

    // 3) Create policy
    return tx.businessPolicy.create({
      data: {
        businessId,
        holderId,
        gameServerId,
        type: data.type,
        coverageAmount: data.coverageAmount,
        premium,
        deductible: data.deductible,
        status: "active",
        commodityId: data.commodityId,
        commodityName: data.commodityName,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        expiresAt,
      },
      select: policySelect,
    });
  });
}

export async function findPoliciesByBusiness(businessId: string) {
  return prisma.businessPolicy.findMany({
    where: { businessId },
    select: policySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findPoliciesByHolder(businessId: string, holderId: string) {
  return prisma.businessPolicy.findMany({
    where: { businessId, holderId },
    select: policySelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findPolicyById(id: string) {
  return prisma.businessPolicy.findUnique({
    where: { id },
    select: { ...policySelect, claims: { select: claimSelect } },
  });
}

export async function createClaim(data: {
  businessId: string;
  policyId: string;
  claimAmount: bigint;
  reason: string;
}) {
  return prisma.businessClaim.create({
    data: { ...data, payout: 0n },
    select: claimSelect,
  });
}

export async function findClaimsByBusiness(businessId: string) {
  return prisma.businessClaim.findMany({
    where: { businessId, status: "pending" },
    select: claimSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findClaimById(id: string) {
  return prisma.businessClaim.findUnique({
    where: { id },
    select: { ...claimSelect, policy: { select: { holderId: true, coverageAmount: true, deductible: true } } },
  });
}

export async function approveClaim(
  claimId: string,
  businessId: string,
  holderId: string,
  payoutAmount: bigint
) {
  return prisma.$transaction(async (tx) => {
    // 1) Debit business wallet
    const bizWallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true, balance: true },
    });
    if (!bizWallet || bizWallet.balance < payoutAmount) {
      throw new Error("Insufficient business funds for payout");
    }

    await tx.businessWallet.update({
      where: { id: bizWallet.id },
      data: { balance: { decrement: payoutAmount } },
    });

    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount: -payoutAmount,
        type: "claim_payout",
        referenceId: claimId,
        description: "Claim payout",
      },
    });

    // 2) Credit holder's wallet
    await tx.wallet.upsert({
      where: { userId: holderId },
      update: { balance: { increment: payoutAmount } },
      create: { userId: holderId, balance: payoutAmount },
    });

    const holderWallet = await tx.wallet.findUnique({
      where: { userId: holderId },
      select: { id: true },
    });
    if (holderWallet) {
      await tx.walletLedger.create({
        data: {
          walletId: holderWallet.id,
          amount: payoutAmount,
          type: "insurance_payout",
          referenceId: claimId,
          description: "Insurance claim payout",
        },
      });
    }

    // 3) Update claim
    return tx.businessClaim.update({
      where: { id: claimId },
      data: { status: "approved", payout: payoutAmount, resolvedAt: new Date() },
      select: claimSelect,
    });
  });
}

export async function denyClaim(claimId: string) {
  return prisma.businessClaim.update({
    where: { id: claimId },
    data: { status: "denied", resolvedAt: new Date() },
    select: claimSelect,
  });
}
