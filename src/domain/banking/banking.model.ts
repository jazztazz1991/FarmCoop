export interface LoanDTO {
  id: string;
  borrowerId: string;
  gameServerId: string;
  principal: string;
  interestRate: number;
  remainingBalance: string;
  monthlyPayment: string;
  termMonths: number;
  paymentsRemaining: number;
  status: string;
  nextPaymentDue: string;
  disbursedAt: string;
  paidOffAt: string | null;
  createdAt: string;
}

export interface SavingsDTO {
  id: string;
  userId: string;
  gameServerId: string;
  balance: string;
  apyBasisPoints: number;
  lastAccrualAt: string;
  createdAt: string;
}

export interface CertificateDTO {
  id: string;
  userId: string;
  gameServerId: string;
  principal: string;
  apyBasisPoints: number;
  termDays: number;
  maturesAt: string;
  status: string;
  createdAt: string;
}

export interface ApplyForLoanInput {
  gameServerId: string;
  principal: string; // BigInt as string
  termMonths: number;
}

export interface DepositSavingsInput {
  gameServerId: string;
  amount: string;
}

export interface WithdrawSavingsInput {
  gameServerId: string;
  amount: string;
}

export interface OpenCertificateInput {
  gameServerId: string;
  principal: string;
  termDays: number;
}

export type LoanStatus = "active" | "paid_off" | "defaulted";
export type CertificateStatus = "active" | "matured" | "withdrawn" | "penalty_withdrawn";
