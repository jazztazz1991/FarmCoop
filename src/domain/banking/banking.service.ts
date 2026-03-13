import type {
  LoanDTO,
  SavingsDTO,
  CertificateDTO,
  ApplyForLoanInput,
  DepositSavingsInput,
  WithdrawSavingsInput,
  OpenCertificateInput,
} from "./banking.model";
import {
  applyForLoanSchema,
  depositSavingsSchema,
  withdrawSavingsSchema,
  openCertificateSchema,
  LOAN_INTEREST_RATE_BP,
  CD_RATES,
} from "./banking.validator";
import * as bankingRepo from "./banking.repository";
import {
  calculateMonthlyPayment,
  calculateInterestAccrual,
  calculateCDPayout,
  calculateEarlyWithdrawalPenalty,
} from "./banking.engine";
import { notify } from "../notification/notification.service";

// ── DTO Mappers ──────────────────────────────────────────

type RepoLoan = Awaited<ReturnType<typeof bankingRepo.findLoansByBorrower>>[number];
type RepoSavings = Awaited<ReturnType<typeof bankingRepo.findOrCreateSavings>>;
type RepoCert = Awaited<ReturnType<typeof bankingRepo.findCertificatesByUser>>[number];

export function toLoanDTO(l: RepoLoan): LoanDTO {
  return {
    id: l.id,
    borrowerId: l.borrowerId,
    gameServerId: l.gameServerId,
    principal: l.principal.toString(),
    interestRate: l.interestRate,
    remainingBalance: l.remainingBalance.toString(),
    monthlyPayment: l.monthlyPayment.toString(),
    termMonths: l.termMonths,
    paymentsRemaining: l.paymentsRemaining,
    status: l.status,
    nextPaymentDue: l.nextPaymentDue.toISOString(),
    disbursedAt: l.disbursedAt.toISOString(),
    paidOffAt: l.paidOffAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

export function toSavingsDTO(s: RepoSavings): SavingsDTO {
  return {
    id: s.id,
    userId: s.userId,
    gameServerId: s.gameServerId,
    balance: s.balance.toString(),
    apyBasisPoints: s.apyBasisPoints,
    lastAccrualAt: s.lastAccrualAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

export function toCertificateDTO(c: RepoCert): CertificateDTO {
  return {
    id: c.id,
    userId: c.userId,
    gameServerId: c.gameServerId,
    principal: c.principal.toString(),
    apyBasisPoints: c.apyBasisPoints,
    termDays: c.termDays,
    maturesAt: c.maturesAt.toISOString(),
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

// ── Loans ────────────────────────────────────────────────

const PAYMENT_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Apply for a loan — validates, calculates payment, disburses atomically */
export async function applyForLoan(
  borrowerId: string,
  input: ApplyForLoanInput
): Promise<LoanDTO> {
  const parsed = applyForLoanSchema.parse(input);
  const principal = BigInt(parsed.principal);

  // Check no existing defaulted loans
  const existing = await bankingRepo.findActiveLoans(borrowerId);
  const allLoans = await bankingRepo.findLoansByBorrower(borrowerId);
  const hasDefaulted = allLoans.some((l) => l.status === "defaulted");
  if (hasDefaulted) throw new Error("Cannot take new loans while in default");

  // Max 3 active loans
  if (existing.length >= 3) throw new Error("Maximum 3 active loans allowed");

  const monthlyPayment = calculateMonthlyPayment(
    principal,
    LOAN_INTEREST_RATE_BP,
    parsed.termMonths
  );

  const remainingBalance = monthlyPayment * BigInt(parsed.termMonths);

  const nextPaymentDue = new Date(Date.now() + PAYMENT_INTERVAL_MS);

  const loan = await bankingRepo.disburseLoan({
    borrowerId,
    gameServerId: parsed.gameServerId,
    principal,
    interestRate: LOAN_INTEREST_RATE_BP,
    remainingBalance,
    monthlyPayment,
    termMonths: parsed.termMonths,
    nextPaymentDue,
  });

  notify({
    userId: borrowerId,
    type: "loan_approved",
    title: "Loan Approved",
    message: `Your loan of ${principal.toString()} has been approved. Monthly payment: ${monthlyPayment.toString()}`,
    referenceId: loan.id,
  }).catch(() => {});

  return toLoanDTO(loan);
}

/** Make a loan payment */
export async function makePayment(
  loanId: string,
  borrowerId: string
): Promise<LoanDTO> {
  const loan = await bankingRepo.findLoanById(loanId);
  if (!loan) throw new Error("Loan not found");
  if (loan.borrowerId !== borrowerId) throw new Error("Not your loan");
  if (loan.status !== "active") throw new Error("Loan is not active");

  const paymentAmount = loan.monthlyPayment;
  const newRemaining = loan.remainingBalance - paymentAmount;
  const newPaymentsRemaining = loan.paymentsRemaining - 1;

  const nextPaymentDue = newPaymentsRemaining > 0
    ? new Date(Date.now() + PAYMENT_INTERVAL_MS)
    : null;

  const updated = await bankingRepo.makeLoanPayment(
    loanId,
    borrowerId,
    paymentAmount,
    newRemaining < 0n ? 0n : newRemaining,
    newPaymentsRemaining,
    nextPaymentDue
  );

  return toLoanDTO(updated);
}

/** Get all loans for a borrower */
export async function getMyLoans(borrowerId: string): Promise<LoanDTO[]> {
  const loans = await bankingRepo.findLoansByBorrower(borrowerId);
  return loans.map(toLoanDTO);
}

// ── Savings ──────────────────────────────────────────────

/** Get savings account (creates if doesn't exist) */
export async function getSavings(
  userId: string,
  gameServerId: string
): Promise<SavingsDTO> {
  const savings = await bankingRepo.findOrCreateSavings(userId, gameServerId);
  return toSavingsDTO(savings);
}

/** Deposit into savings */
export async function depositToSavings(
  userId: string,
  input: DepositSavingsInput
): Promise<SavingsDTO> {
  const parsed = depositSavingsSchema.parse(input);
  const amount = BigInt(parsed.amount);
  const savings = await bankingRepo.depositToSavings(userId, parsed.gameServerId, amount);
  return toSavingsDTO(savings);
}

/** Withdraw from savings */
export async function withdrawFromSavings(
  userId: string,
  input: WithdrawSavingsInput
): Promise<SavingsDTO> {
  const parsed = withdrawSavingsSchema.parse(input);
  const amount = BigInt(parsed.amount);
  const savings = await bankingRepo.withdrawFromSavings(userId, parsed.gameServerId, amount);
  return toSavingsDTO(savings);
}

/** Accrue interest on all savings accounts (cron job) */
export async function accrueInterest(): Promise<number> {
  const accounts = await bankingRepo.findAllActiveSavings();
  let count = 0;

  for (const acct of accounts) {
    const daysSinceLastAccrual = Math.floor(
      (Date.now() - acct.lastAccrualAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceLastAccrual < 1) continue;

    const interest = calculateInterestAccrual(
      acct.balance,
      acct.apyBasisPoints,
      daysSinceLastAccrual
    );
    if (interest <= 0n) continue;

    await bankingRepo.accrueSavingsInterest(acct.id, interest);
    count++;
  }

  return count;
}

// ── Certificates ─────────────────────────────────────────

/** Open a new CD */
export async function openCertificate(
  userId: string,
  input: OpenCertificateInput
): Promise<CertificateDTO> {
  const parsed = openCertificateSchema.parse(input);
  const principal = BigInt(parsed.principal);
  const apyBasisPoints = CD_RATES[parsed.termDays];

  const maturesAt = new Date(Date.now() + parsed.termDays * 24 * 60 * 60 * 1000);

  const cert = await bankingRepo.openCertificate({
    userId,
    gameServerId: parsed.gameServerId,
    principal,
    apyBasisPoints,
    termDays: parsed.termDays,
    maturesAt,
  });

  return toCertificateDTO(cert);
}

/** Withdraw a CD — full payout at maturity, penalty for early withdrawal */
export async function withdrawCertificate(
  certId: string,
  userId: string
): Promise<CertificateDTO> {
  const cert = await bankingRepo.findCertificateById(certId);
  if (!cert) throw new Error("Certificate not found");
  if (cert.userId !== userId) throw new Error("Not your certificate");
  if (cert.status !== "active") throw new Error("Certificate is not active");

  const now = new Date();
  const isMatured = now >= cert.maturesAt;

  let payout: bigint;
  let status: "withdrawn" | "penalty_withdrawn";

  if (isMatured) {
    payout = calculateCDPayout(cert.principal, cert.apyBasisPoints, cert.termDays);
    status = "withdrawn";
  } else {
    const daysHeld = Math.floor(
      (now.getTime() - cert.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    const fullPayout = calculateCDPayout(cert.principal, cert.apyBasisPoints, daysHeld);
    const penalty = calculateEarlyWithdrawalPenalty(
      cert.principal,
      cert.apyBasisPoints,
      daysHeld,
      cert.termDays
    );
    payout = fullPayout - penalty;
    if (payout < cert.principal) payout = cert.principal; // never lose principal
    status = "penalty_withdrawn";
  }

  const updated = await bankingRepo.withdrawCertificate(certId, userId, payout, status);

  if (isMatured) {
    notify({
      userId,
      type: "cd_matured",
      title: "CD Matured",
      message: `Your ${cert.termDays}-day CD has matured. Payout: ${payout.toString()}`,
      referenceId: certId,
    }).catch(() => {});
  }

  return toCertificateDTO(updated);
}

/** Get all certificates for a user */
export async function getMyCertificates(userId: string): Promise<CertificateDTO[]> {
  const certs = await bankingRepo.findCertificatesByUser(userId);
  return certs.map(toCertificateDTO);
}

/** Mature certificates that have reached their term (cron job) */
export async function matureCertificates(): Promise<number> {
  const matured = await bankingRepo.findMaturedCertificates();
  let count = 0;

  for (const cert of matured) {
    const payout = calculateCDPayout(cert.principal, cert.apyBasisPoints, cert.termDays);
    await bankingRepo.withdrawCertificate(cert.id, cert.userId, payout, "withdrawn");

    notify({
      userId: cert.userId,
      type: "cd_matured",
      title: "CD Matured",
      message: `Your ${cert.termDays}-day CD has matured. Payout: ${payout.toString()}`,
      referenceId: cert.id,
    }).catch(() => {});

    count++;
  }

  return count;
}
