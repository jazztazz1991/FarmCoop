export interface BankSettings {
  interestRateBp: number; // basis points (500 = 5.00%)
  maxLoanAmount: string; // BigInt as string
}

export const DEFAULT_BANK_SETTINGS: BankSettings = {
  interestRateBp: 500,
  maxLoanAmount: "1000000",
};

export interface LoanApplicationDTO {
  id: string;
  businessId: string;
  businessName: string;
  applicantId: string;
  applicantName: string;
  principal: string;
  termMonths: number;
  interestRateBp: number;
  estimatedMonthlyPayment: string;
  status: string;
  denialReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface BusinessLoanDTO {
  id: string;
  businessId: string;
  businessName: string;
  borrowerId: string;
  borrowerName: string;
  principal: string;
  interestRate: number;
  remainingBalance: string;
  monthlyPayment: string;
  termMonths: number;
  paymentsRemaining: number;
  status: string;
  nextPaymentDue: string | null;
  createdAt: string;
}

export interface ApplyForLoanInput {
  principal: string;
  termMonths: number;
}

export interface ReviewApplicationInput {
  decision: "approve" | "deny";
  denialReason?: string;
}
