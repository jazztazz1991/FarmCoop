import type {
  PolicyDTO,
  ClaimDTO,
  PurchasePolicyInput,
  FileClaimInput,
} from "./insurance.model";
import { purchasePolicySchema, fileClaimSchema } from "./insurance.validator";
import * as insuranceRepo from "./insurance.repository";
import {
  calculatePremium,
  calculateCropPayout,
  calculateGeneralPayout,
  RISK_RATES,
} from "./insurance.engine";
import { notify } from "../notification/notification.service";
import { getPrice } from "../pricing/pricing.service";

// ── DTO Mappers ──────────────────────────────────────────

type RepoPolicy = Awaited<ReturnType<typeof insuranceRepo.findPoliciesByHolder>>[number];
type RepoClaim = Awaited<ReturnType<typeof insuranceRepo.findClaimsByHolder>>[number];

export function toPolicyDTO(p: RepoPolicy): PolicyDTO {
  return {
    id: p.id,
    holderId: p.holderId,
    gameServerId: p.gameServerId,
    type: p.type,
    coverageAmount: p.coverageAmount.toString(),
    premium: p.premium.toString(),
    deductible: p.deductible.toString(),
    status: p.status,
    commodityId: p.commodityId,
    commodityName: p.commodityName,
    strikePrice: p.strikePrice?.toString() ?? null,
    equipmentId: p.equipmentId,
    equipmentName: p.equipmentName,
    startsAt: p.startsAt.toISOString(),
    expiresAt: p.expiresAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  };
}

export function toClaimDTO(c: RepoClaim): ClaimDTO {
  return {
    id: c.id,
    policyId: c.policyId,
    claimAmount: c.claimAmount.toString(),
    payout: c.payout.toString(),
    reason: c.reason,
    status: c.status,
    resolvedAt: c.resolvedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

// ── Purchase ─────────────────────────────────────────────

/** Purchase an insurance policy */
export async function purchasePolicy(
  holderId: string,
  input: PurchasePolicyInput
): Promise<PolicyDTO> {
  const parsed = purchasePolicySchema.parse(input);
  const coverageAmount = BigInt(parsed.coverageAmount);
  const deductible = BigInt(parsed.deductible);
  const riskRate = RISK_RATES[parsed.type] ?? 300;

  const premium = calculatePremium(coverageAmount, riskRate, parsed.termDays);
  if (premium <= 0n) throw new Error("Premium calculation error");

  const expiresAt = new Date(Date.now() + parsed.termDays * 24 * 60 * 60 * 1000);

  const policy = await insuranceRepo.purchasePolicy({
    holderId,
    gameServerId: parsed.gameServerId,
    type: parsed.type,
    coverageAmount,
    premium,
    deductible,
    commodityId: parsed.commodityId,
    commodityName: parsed.commodityName,
    strikePrice: parsed.strikePrice ? BigInt(parsed.strikePrice) : undefined,
    equipmentId: parsed.equipmentId,
    equipmentName: parsed.equipmentName,
    expiresAt,
  });

  notify({
    userId: holderId,
    type: "policy_purchased",
    title: "Policy Purchased",
    message: `${parsed.type} insurance policy purchased. Coverage: ${coverageAmount.toString()}`,
    referenceId: policy.id,
  }).catch(() => {});

  return toPolicyDTO(policy);
}

// ── Claims ───────────────────────────────────────────────

/** File a claim against a policy */
export async function fileClaim(
  holderId: string,
  input: FileClaimInput
): Promise<ClaimDTO> {
  const parsed = fileClaimSchema.parse(input);
  const claimAmount = BigInt(parsed.claimAmount);

  const policy = await insuranceRepo.findPolicyById(parsed.policyId);
  if (!policy) throw new Error("Policy not found");
  if (policy.holderId !== holderId) throw new Error("Not your policy");
  if (policy.status !== "active") throw new Error("Policy is not active");
  if (policy.expiresAt < new Date()) throw new Error("Policy has expired");

  let payout: bigint;

  if (policy.type === "crop") {
    // Auto-evaluate crop claims using current price
    if (!policy.commodityId || !policy.strikePrice) {
      throw new Error("Invalid crop policy data");
    }

    const priceDTO = await getPrice(policy.gameServerId, policy.commodityId);
    if (!priceDTO) throw new Error("Cannot determine current commodity price");

    const currentPrice = BigInt(priceDTO.currentPrice);
    payout = calculateCropPayout(
      policy.strikePrice,
      currentPrice,
      Number(claimAmount), // quantity for crop claims
      policy.deductible,
      policy.coverageAmount
    );
  } else {
    payout = calculateGeneralPayout(
      claimAmount,
      policy.deductible,
      policy.coverageAmount
    );
  }

  if (payout <= 0n) {
    // Deny claim — no payout
    const claim = await insuranceRepo.denyClaim({
      policyId: parsed.policyId,
      claimAmount,
      reason: parsed.reason,
    });

    notify({
      userId: holderId,
      type: "claim_denied",
      title: "Claim Denied",
      message: `Your ${policy.type} insurance claim was denied: loss below deductible`,
      referenceId: claim.id,
    }).catch(() => {});

    return toClaimDTO(claim);
  }

  // Approve claim with payout
  const claim = await insuranceRepo.approveClaim({
    policyId: parsed.policyId,
    holderId,
    claimAmount,
    payout,
    reason: parsed.reason,
  });

  notify({
    userId: holderId,
    type: "claim_approved",
    title: "Claim Approved",
    message: `Your ${policy.type} insurance claim was approved. Payout: ${payout.toString()}`,
    referenceId: claim.id,
  }).catch(() => {});

  return toClaimDTO(claim);
}

// ── Queries ──────────────────────────────────────────────

/** Get all policies for a user */
export async function getMyPolicies(holderId: string): Promise<PolicyDTO[]> {
  const policies = await insuranceRepo.findPoliciesByHolder(holderId);
  return policies.map(toPolicyDTO);
}

/** Get all claims for a user */
export async function getMyClaims(holderId: string): Promise<ClaimDTO[]> {
  const claims = await insuranceRepo.findClaimsByHolder(holderId);
  return claims.map(toClaimDTO);
}

/** Get premium quote */
export function getPremiumQuote(
  type: string,
  coverageAmount: string,
  termDays: number
): string {
  const coverage = BigInt(coverageAmount);
  const riskRate = RISK_RATES[type] ?? 300;
  return calculatePremium(coverage, riskRate, termDays).toString();
}

/** Expire all policies past their expiration date (cron) */
export async function expirePolicies(): Promise<number> {
  const expired = await insuranceRepo.findExpiredPolicies();
  let count = 0;

  for (const policy of expired) {
    await insuranceRepo.expirePolicy(policy.id);
    count++;
  }

  return count;
}
