export interface InsuranceCoSettings {
  riskRates: Record<string, number>; // type -> basis points
  maxCoverage: string;
}

export interface BusinessPolicyDTO {
  id: string;
  businessId: string;
  businessName: string;
  holderId: string;
  holderName: string;
  type: string;
  coverageAmount: string;
  premium: string;
  deductible: string;
  status: string;
  commodityId: string | null;
  commodityName: string | null;
  equipmentId: string | null;
  equipmentName: string | null;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface BusinessClaimDTO {
  id: string;
  businessId: string;
  policyId: string;
  claimAmount: string;
  payout: string;
  reason: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface PurchasePolicyInput {
  type: string;
  coverageAmount: string;
  termDays: number;
  commodityId?: string;
  commodityName?: string;
  equipmentId?: string;
  equipmentName?: string;
}

export interface FileClaimInput {
  claimAmount: string;
  reason: string;
}

export interface ReviewClaimInput {
  decision: "approve" | "deny";
  payout?: string;
}
