export interface PolicyDTO {
  id: string;
  holderId: string;
  gameServerId: string;
  type: string;
  coverageAmount: string;
  premium: string;
  deductible: string;
  status: string;
  commodityId: string | null;
  commodityName: string | null;
  strikePrice: string | null;
  equipmentId: string | null;
  equipmentName: string | null;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface ClaimDTO {
  id: string;
  policyId: string;
  claimAmount: string;
  payout: string;
  reason: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface PurchasePolicyInput {
  gameServerId: string;
  type: string;
  coverageAmount: string;
  termDays: number;
  deductible?: string;
  commodityId?: string;
  commodityName?: string;
  strikePrice?: string;
  equipmentId?: string;
  equipmentName?: string;
}

export interface FileClaimInput {
  policyId: string;
  claimAmount: string;
  reason: string;
}

export type InsuranceType = "crop" | "vehicle" | "liability";
export type PolicyStatus = "active" | "expired" | "claimed" | "cancelled";
export type ClaimStatus = "pending" | "approved" | "denied";
