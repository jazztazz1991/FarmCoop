import { NotFoundError, ForbiddenError } from "@/domain/errors";
import { applyForLoanSchema, reviewApplicationSchema } from "./bank.validator";
import { calculateMonthlyPayment, getInterestRate, getMaxLoanAmount, isLoanWithinLimits } from "./bank.engine";
import * as repo from "./bank.repository";
import * as bizRepo from "../business.repository";
import type { LoanApplicationDTO, BusinessLoanDTO, ApplyForLoanInput, ReviewApplicationInput } from "./bank.model";

function toApplicationDTO(row: {
  id: string;
  businessId: string;
  business: { name: string };
  applicantId: string;
  applicant: { displayName: string };
  principal: bigint;
  termMonths: number;
  status: string;
  denialReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}, interestRateBp: number): LoanApplicationDTO {
  const monthlyPayment = calculateMonthlyPayment(row.principal, interestRateBp, row.termMonths);
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.business.name,
    applicantId: row.applicantId,
    applicantName: row.applicant.displayName,
    principal: row.principal.toString(),
    termMonths: row.termMonths,
    interestRateBp,
    estimatedMonthlyPayment: monthlyPayment.toString(),
    status: row.status,
    denialReason: row.denialReason,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toLoanDTO(row: {
  id: string;
  businessId: string;
  business: { name: string };
  borrowerId: string;
  borrower: { displayName: string };
  principal: bigint;
  interestRate: number;
  remainingBalance: bigint;
  monthlyPayment: bigint;
  termMonths: number;
  paymentsRemaining: number;
  status: string;
  nextPaymentDue: Date | null;
  createdAt: Date;
}): BusinessLoanDTO {
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.business.name,
    borrowerId: row.borrowerId,
    borrowerName: row.borrower.displayName,
    principal: row.principal.toString(),
    interestRate: row.interestRate,
    remainingBalance: row.remainingBalance.toString(),
    monthlyPayment: row.monthlyPayment.toString(),
    termMonths: row.termMonths,
    paymentsRemaining: row.paymentsRemaining,
    status: row.status,
    nextPaymentDue: row.nextPaymentDue?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function applyForLoan(
  userId: string,
  businessId: string,
  input: ApplyForLoanInput
): Promise<LoanApplicationDTO> {
  const parsed = applyForLoanSchema.parse(input);
  const principal = BigInt(parsed.principal);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Bank not found");
  if (business.type !== "bank") throw new ForbiddenError("Not a bank");
  if (business.status !== "active") throw new ForbiddenError("Bank is not active");

  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const maxLoan = getMaxLoanAmount(settings);
  if (!isLoanWithinLimits(principal, maxLoan)) {
    throw new ForbiddenError(`Loan amount exceeds bank limit of ${maxLoan.toString()}`);
  }

  const app = await repo.createApplication({
    businessId,
    applicantId: userId,
    gameServerId: business.gameServerId,
    principal,
    termMonths: parsed.termMonths,
  });

  const interestRateBp = getInterestRate(settings);
  return toApplicationDTO(app, interestRateBp);
}

export async function getApplications(
  userId: string,
  businessId: string
): Promise<LoanApplicationDTO[]> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Bank not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the bank owner");

  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const interestRateBp = getInterestRate(settings);

  const apps = await repo.findApplicationsByBusiness(businessId);
  return apps.map((a) => toApplicationDTO(a, interestRateBp));
}

export async function reviewApplication(
  userId: string,
  businessId: string,
  applicationId: string,
  input: ReviewApplicationInput
): Promise<LoanApplicationDTO | BusinessLoanDTO> {
  const parsed = reviewApplicationSchema.parse(input);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Bank not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the bank owner");

  const application = await repo.findApplicationById(applicationId);
  if (!application || application.businessId !== businessId) {
    throw new NotFoundError("Application not found");
  }
  if (application.status !== "pending") {
    throw new ForbiddenError("Application already reviewed");
  }

  const settings = (business.settings ?? {}) as Record<string, unknown>;
  const interestRateBp = getInterestRate(settings);

  if (parsed.decision === "deny") {
    const denied = await repo.denyApplication(applicationId, parsed.denialReason ?? "");
    return toApplicationDTO(denied, interestRateBp);
  }

  // Approve
  const monthlyPayment = calculateMonthlyPayment(
    application.principal,
    interestRateBp,
    application.termMonths
  );

  const nextPaymentDue = new Date();
  nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

  const loan = await repo.approveApplication(
    applicationId,
    businessId,
    application.applicantId,
    business.gameServerId,
    application.principal,
    interestRateBp,
    monthlyPayment,
    application.termMonths,
    nextPaymentDue
  );

  return toLoanDTO(loan);
}

export async function getLoans(
  userId: string,
  businessId: string
): Promise<BusinessLoanDTO[]> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Bank not found");

  const isOwner = business.ownerId === userId;
  const loans = isOwner
    ? await repo.findLoansByBusiness(businessId)
    : await repo.findLoansByBorrower(businessId, userId);

  return loans.map(toLoanDTO);
}

export async function makePayment(
  userId: string,
  businessId: string,
  loanId: string
): Promise<BusinessLoanDTO> {
  const loan = await repo.findLoanById(loanId);
  if (!loan) throw new NotFoundError("Loan not found");
  if (loan.businessId !== businessId) throw new NotFoundError("Loan not found");
  if (loan.borrowerId !== userId) throw new ForbiddenError("Not the borrower");
  if (loan.status !== "active") throw new ForbiddenError("Loan is not active");

  const updated = await repo.makePayment(
    loanId,
    businessId,
    userId,
    loan.monthlyPayment
  );

  return toLoanDTO(updated);
}
