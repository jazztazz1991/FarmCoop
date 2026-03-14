import { NotFoundError, ForbiddenError } from "@/domain/errors";
import { purchasePolicySchema, fileClaimSchema, reviewClaimSchema } from "./insurance-co.validator";
import { calculatePremium, getCustomRiskRate, suggestPayout } from "./insurance-co.engine";
import * as repo from "./insurance-co.repository";
import * as bizRepo from "../business.repository";
import type { BusinessPolicyDTO, BusinessClaimDTO, PurchasePolicyInput, FileClaimInput, ReviewClaimInput } from "./insurance-co.model";

function toPolicyDTO(row: {
  id: string;
  businessId: string;
  business: { name: string };
  holderId: string;
  holder: { displayName: string };
  type: string;
  coverageAmount: bigint;
  premium: bigint;
  deductible: bigint;
  status: string;
  commodityId: string | null;
  commodityName: string | null;
  equipmentId: string | null;
  equipmentName: string | null;
  startsAt: Date;
  expiresAt: Date;
  createdAt: Date;
}): BusinessPolicyDTO {
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.business.name,
    holderId: row.holderId,
    holderName: row.holder.displayName,
    type: row.type,
    coverageAmount: row.coverageAmount.toString(),
    premium: row.premium.toString(),
    deductible: row.deductible.toString(),
    status: row.status,
    commodityId: row.commodityId,
    commodityName: row.commodityName,
    equipmentId: row.equipmentId,
    equipmentName: row.equipmentName,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toClaimDTO(row: {
  id: string;
  businessId: string;
  policyId: string;
  claimAmount: bigint;
  payout: bigint;
  reason: string;
  status: string;
  resolvedAt: Date | null;
  createdAt: Date;
}): BusinessClaimDTO {
  return {
    id: row.id,
    businessId: row.businessId,
    policyId: row.policyId,
    claimAmount: row.claimAmount.toString(),
    payout: row.payout.toString(),
    reason: row.reason,
    status: row.status,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function purchasePolicy(
  userId: string,
  businessId: string,
  input: PurchasePolicyInput
): Promise<BusinessPolicyDTO> {
  const parsed = purchasePolicySchema.parse(input);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Insurance company not found");
  if (business.type !== "insurance") throw new ForbiddenError("Not an insurance company");
  if (business.status !== "active") throw new ForbiddenError("Company is not active");

  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const riskRate = getCustomRiskRate(settings, parsed.type);
  const coverageAmount = BigInt(parsed.coverageAmount);
  const premium = calculatePremium(coverageAmount, riskRate, parsed.termDays);
  const deductible = coverageAmount / 10n; // 10% deductible default

  const policy = await repo.createPolicy(
    businessId,
    userId,
    business.gameServerId,
    premium,
    {
      type: parsed.type,
      coverageAmount,
      deductible,
      termDays: parsed.termDays,
      commodityId: parsed.commodityId,
      commodityName: parsed.commodityName,
      equipmentId: parsed.equipmentId,
      equipmentName: parsed.equipmentName,
    }
  );

  return toPolicyDTO(policy);
}

export async function getPolicies(
  userId: string,
  businessId: string
): Promise<BusinessPolicyDTO[]> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Insurance company not found");

  const isOwner = business.ownerId === userId;
  const policies = isOwner
    ? await repo.findPoliciesByBusiness(businessId)
    : await repo.findPoliciesByHolder(businessId, userId);

  return policies.map(toPolicyDTO);
}

export async function fileClaim(
  userId: string,
  businessId: string,
  policyId: string,
  input: FileClaimInput
): Promise<BusinessClaimDTO> {
  const parsed = fileClaimSchema.parse(input);

  const policy = await repo.findPolicyById(policyId);
  if (!policy || policy.businessId !== businessId) throw new NotFoundError("Policy not found");
  if (policy.holderId !== userId) throw new ForbiddenError("Not the policy holder");
  if (policy.status !== "active") throw new ForbiddenError("Policy is not active");

  const claim = await repo.createClaim({
    businessId,
    policyId,
    claimAmount: BigInt(parsed.claimAmount),
    reason: parsed.reason,
  });

  return toClaimDTO(claim);
}

export async function getClaimsForReview(
  userId: string,
  businessId: string
): Promise<BusinessClaimDTO[]> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Insurance company not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the company owner");

  const claims = await repo.findClaimsByBusiness(businessId);
  return claims.map(toClaimDTO);
}

export async function reviewClaim(
  userId: string,
  businessId: string,
  claimId: string,
  input: ReviewClaimInput
): Promise<BusinessClaimDTO> {
  const parsed = reviewClaimSchema.parse(input);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Insurance company not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the company owner");

  const claim = await repo.findClaimById(claimId);
  if (!claim || claim.businessId !== businessId) throw new NotFoundError("Claim not found");
  if (claim.status !== "pending") throw new ForbiddenError("Claim already reviewed");

  if (parsed.decision === "deny") {
    const denied = await repo.denyClaim(claimId);
    return toClaimDTO(denied);
  }

  // Approve with payout
  const claimWithPolicy = claim as typeof claim & { policy: { holderId: string; coverageAmount: bigint; deductible: bigint } };
  const payoutAmount = parsed.payout
    ? BigInt(parsed.payout)
    : suggestPayout(claim.claimAmount, claimWithPolicy.policy.deductible, claimWithPolicy.policy.coverageAmount);

  const approved = await repo.approveClaim(
    claimId,
    businessId,
    claimWithPolicy.policy.holderId,
    payoutAmount
  );

  return toClaimDTO(approved);
}
