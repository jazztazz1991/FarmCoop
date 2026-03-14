import { prisma } from "@/lib/prisma";

const applicationSelect = {
  id: true,
  businessId: true,
  business: { select: { name: true } },
  applicantId: true,
  applicant: { select: { displayName: true } },
  principal: true,
  termMonths: true,
  status: true,
  denialReason: true,
  reviewedAt: true,
  createdAt: true,
};

const loanSelect = {
  id: true,
  businessId: true,
  business: { select: { name: true } },
  borrowerId: true,
  borrower: { select: { displayName: true } },
  principal: true,
  interestRate: true,
  remainingBalance: true,
  monthlyPayment: true,
  termMonths: true,
  paymentsRemaining: true,
  status: true,
  nextPaymentDue: true,
  createdAt: true,
};

export async function createApplication(data: {
  businessId: string;
  applicantId: string;
  gameServerId: string;
  principal: bigint;
  termMonths: number;
}) {
  return prisma.loanApplication.create({
    data,
    select: applicationSelect,
  });
}

export async function findApplicationById(id: string) {
  return prisma.loanApplication.findUnique({
    where: { id },
    select: applicationSelect,
  });
}

export async function findApplicationsByBusiness(businessId: string) {
  return prisma.loanApplication.findMany({
    where: { businessId, status: "pending" },
    select: applicationSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function denyApplication(id: string, reason: string) {
  return prisma.loanApplication.update({
    where: { id },
    data: { status: "denied", denialReason: reason, reviewedAt: new Date() },
    select: applicationSelect,
  });
}

export async function approveApplication(
  applicationId: string,
  businessId: string,
  borrowerId: string,
  gameServerId: string,
  principal: bigint,
  interestRate: number,
  monthlyPayment: bigint,
  termMonths: number,
  nextPaymentDue: Date
) {
  return prisma.$transaction(async (tx) => {
    // 1) Check business wallet has funds
    const wallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true, balance: true },
    });
    if (!wallet || wallet.balance < principal) {
      throw new Error("Insufficient business wallet funds");
    }

    // 2) Debit business wallet
    await tx.businessWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: principal } },
    });

    // 3) Credit business ledger
    await tx.businessLedger.create({
      data: {
        businessWalletId: wallet.id,
        amount: -principal,
        type: "loan_disbursement",
        referenceId: applicationId,
        description: `Loan disbursement to borrower`,
      },
    });

    // 4) Credit borrower's personal wallet
    await tx.wallet.upsert({
      where: { userId: borrowerId },
      update: { balance: { increment: principal } },
      create: { userId: borrowerId, balance: principal },
    });

    // 5) Personal wallet ledger entry
    const borrowerWallet = await tx.wallet.findUnique({
      where: { userId: borrowerId },
      select: { id: true },
    });
    if (borrowerWallet) {
      await tx.walletLedger.create({
        data: {
          walletId: borrowerWallet.id,
          amount: principal,
          type: "loan_disbursement",
          referenceId: applicationId,
          description: "Loan disbursement received",
        },
      });
    }

    // 6) Update application status
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: { status: "approved", reviewedAt: new Date() },
    });

    // 7) Create BusinessLoan
    const loan = await tx.businessLoan.create({
      data: {
        businessId,
        applicationId,
        borrowerId,
        gameServerId,
        principal,
        interestRate,
        remainingBalance: principal,
        monthlyPayment,
        termMonths,
        paymentsRemaining: termMonths,
        nextPaymentDue,
      },
      select: loanSelect,
    });

    return loan;
  });
}

export async function findLoansByBusiness(businessId: string) {
  return prisma.businessLoan.findMany({
    where: { businessId },
    select: loanSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findLoansByBorrower(businessId: string, borrowerId: string) {
  return prisma.businessLoan.findMany({
    where: { businessId, borrowerId },
    select: loanSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findLoanById(id: string) {
  return prisma.businessLoan.findUnique({
    where: { id },
    select: loanSelect,
  });
}

export async function makePayment(
  loanId: string,
  businessId: string,
  borrowerId: string,
  paymentAmount: bigint
) {
  return prisma.$transaction(async (tx) => {
    // 1) Get loan
    const loan = await tx.businessLoan.findUnique({
      where: { id: loanId },
      select: { id: true, remainingBalance: true, monthlyPayment: true, paymentsRemaining: true },
    });
    if (!loan) throw new Error("Loan not found");
    if (loan.paymentsRemaining <= 0) throw new Error("Loan already paid off");

    const actualPayment = paymentAmount < loan.remainingBalance ? paymentAmount : loan.remainingBalance;
    const newRemaining = loan.remainingBalance - actualPayment;
    const newPaymentsRemaining = newRemaining <= 0n ? 0 : loan.paymentsRemaining - 1;
    const isPaidOff = newRemaining <= 0n;

    // 2) Debit borrower's wallet
    const borrowerWallet = await tx.wallet.findUnique({
      where: { userId: borrowerId },
      select: { id: true, balance: true },
    });
    if (!borrowerWallet || borrowerWallet.balance < actualPayment) {
      throw new Error("Insufficient funds for payment");
    }

    await tx.wallet.update({
      where: { id: borrowerWallet.id },
      data: { balance: { decrement: actualPayment } },
    });

    await tx.walletLedger.create({
      data: {
        walletId: borrowerWallet.id,
        amount: -actualPayment,
        type: "loan_payment",
        referenceId: loanId,
        description: "Business loan payment",
      },
    });

    // 3) Credit business wallet
    const bizWallet = await tx.businessWallet.findUnique({
      where: { businessId },
      select: { id: true },
    });
    if (!bizWallet) throw new Error("Business wallet not found");

    await tx.businessWallet.update({
      where: { id: bizWallet.id },
      data: { balance: { increment: actualPayment } },
    });

    await tx.businessLedger.create({
      data: {
        businessWalletId: bizWallet.id,
        amount: actualPayment,
        type: "loan_repayment",
        referenceId: loanId,
        description: "Loan repayment received",
      },
    });

    // 4) Update loan
    const nextPaymentDue = new Date();
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

    return tx.businessLoan.update({
      where: { id: loanId },
      data: {
        remainingBalance: newRemaining,
        paymentsRemaining: newPaymentsRemaining,
        status: isPaidOff ? "paid_off" : "active",
        nextPaymentDue: isPaidOff ? undefined : nextPaymentDue,
        paidOffAt: isPaidOff ? new Date() : undefined,
      },
      select: loanSelect,
    });
  });
}
