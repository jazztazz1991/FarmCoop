export type BusinessType = "bank" | "dealership" | "insurance" | "trucking";
export type BusinessStatus = "active" | "suspended" | "closed";

export interface BusinessDTO {
  id: string;
  ownerId: string;
  ownerName: string;
  gameServerId: string;
  serverName: string;
  type: BusinessType;
  name: string;
  description: string;
  status: BusinessStatus;
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface BusinessWalletDTO {
  balance: string;
}

export interface BusinessLedgerEntryDTO {
  id: string;
  amount: string;
  type: string;
  description: string;
  createdAt: Date;
}

export type BusinessLedgerType =
  | "owner_deposit"
  | "owner_withdrawal"
  | "loan_disbursement"
  | "loan_repayment"
  | "loan_interest_income"
  | "premium_income"
  | "claim_payout"
  | "dealership_sale"
  | "dealership_purchase"
  | "delivery_payout";

export interface CreateBusinessInput {
  gameServerId: string;
  type: BusinessType;
  name: string;
  description?: string;
}

export interface UpdateBusinessSettingsInput {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface WalletTransferInput {
  amount: string;
}
