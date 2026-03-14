export interface BalanceDTO {
  balance: string; // BigInt serialized as string for JSON
}

export interface WalletLedgerEntryDTO {
  id: string;
  amount: string;
  type: string;
  description: string;
  createdAt: Date;
}

export type LedgerType =
  | "deposit"
  | "withdrawal"
  | "transfer_in"
  | "transfer_out"
  | "sale"
  | "purchase"
  | "contract_escrow"
  | "contract_payout"
  | "contract_refund"
  | "loan_disbursement"
  | "loan_payment"
  | "savings_deposit"
  | "savings_withdrawal"
  | "savings_interest"
  | "cd_deposit"
  | "cd_maturity"
  | "cd_early_withdrawal"
  | "insurance_premium"
  | "insurance_payout"
  | "production_input_cost"
  | "production_output_sale"
  | "business_wallet_deposit"
  | "business_wallet_withdrawal"
  | "business_loan_disbursement"
  | "business_loan_repayment"
  | "dealership_purchase"
  | "dealership_sale_income"
  | "business_premium_income"
  | "business_claim_payout"
  | "delivery_escrow"
  | "delivery_payout_received";
